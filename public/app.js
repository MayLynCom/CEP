const form = document.getElementById("towing-form");
const resultSection = document.getElementById("result");
const errorSection = document.getElementById("error");
const distanceEl = document.getElementById("distance-km");
const priceEl = document.getElementById("price");
const sanitizeCep = (value) => value.replace(/\D/g, "");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const vehicleCep = sanitizeCep(
    document.getElementById("vehicle-cep").value || ""
  );
  const destinationCep = sanitizeCep(
    document.getElementById("destination-cep").value || ""
  );
  const vehicleType =
    document.getElementById("vehicle-type").value || "carro";

  if (vehicleCep.length !== 8 || destinationCep.length !== 8) {
    showError("Informe dois CEPs validos com 8 digitos.");
    return;
  }

  setLoading(true);

  try {
    const { distanceKm, price } = await fetchDistanceData(
      vehicleCep,
      destinationCep,
      vehicleType
    );
    distanceEl.textContent = `${distanceKm.toFixed(2)} km`;
    priceEl.textContent = formatCurrency(price);
    showResult();
  } catch (error) {
    showError(error.message || "Nao foi possivel calcular a distancia.");
  } finally {
    setLoading(false);
  }
});

async function fetchDistanceData(vehicleCep, destinationCep, vehicleType) {
  let response;
  try {
    response = await fetch("/.netlify/functions/distance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicleCep, destinationCep, vehicleType }),
    });
  } catch (error) {
    throw new Error("Falha ao se conectar com o servidor.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("Resposta invalida do servidor.");
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Nao foi possivel calcular a distancia.");
  }

  if (
    typeof payload.distanceKm !== "number" ||
    typeof payload.price !== "number"
  ) {
    throw new Error("O servidor nao retornou dados esperados.");
  }

  return payload;
}

function showResult() {
  resultSection.classList.remove("hidden");
  errorSection.classList.add("hidden");
}

function showError(message) {
  errorSection.textContent = message;
  errorSection.classList.remove("hidden");
  resultSection.classList.add("hidden");
}

function setLoading(isLoading) {
  const button = form.querySelector("button");
  button.disabled = isLoading;
  button.textContent = isLoading ? "Calculando..." : "Calcular";
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
