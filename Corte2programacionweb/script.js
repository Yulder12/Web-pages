
// Función que representa la ecuación, con verificación de división por cero
function Ecuacion(coef, x) {
    // Verificación para evitar división por cero
    if (coef[3] + Math.sqrt(Math.abs(x)) === 0) {
        throw new Error("Error: División por cero al calcular la ecuación.");
    }

    // Si no hay división por cero, calcular la ecuación normalmente
    return coef[0] * Math.sin(x) + 
           coef[1] * Math.cos(x) + 
           (coef[2] * Math.pow(x, 2)) / (coef[3] + Math.sqrt(Math.abs(x))) + 
           coef[4] * Math.pow(x, 3) + 
           coef[5] * Math.pow(x, 4) + 
           coef[6];
}


// Implementación del método de la regla del trapecio
function ReglaTrapecio(coef, xIni, xFin, intervalos) {
    const longIntervalo = (xFin - xIni) / intervalos;
    let acumula = 0.5 * (Ecuacion(coef, xIni) + Ecuacion(coef, xFin));

    // Suma los puntos intermedios
    for (let i = 1; i < intervalos; i++) {
        const valX = xIni + i * longIntervalo;
        acumula += Ecuacion(coef, valX);
    }

    return acumula * longIntervalo;
}

// Implementación del método de la suma de Riemann
function SumaRiemann(coef, xIni, xFin, intervalos) {
    const longIntervalo = (xFin - xIni) / intervalos;
    let acumula = 0.0;

    for (let i = 0; i < intervalos; i++) {
        const valX = xIni + i * longIntervalo;
        acumula += Ecuacion(coef, valX) * longIntervalo;
    }

    return acumula;
}

// Implementación de la regla de Simpson
function ReglaSimpson(coef, xIni, xFin, intervalos) {
    if (intervalos % 2 !== 0) {
        throw new Error("El número de intervalos debe ser par");
    }

    const longIntervalo = (xFin - xIni) / intervalos;
    let acumula = Ecuacion(coef, xIni) + Ecuacion(coef, xFin);

    // Suma alternando multiplicadores 4 y 2 según la regla de Simpson
    for (let i = 1; i < intervalos; i++) {
        const valX = xIni + i * longIntervalo;
        acumula += (i % 2 === 0 ? 2 : 4) * Ecuacion(coef, valX);
    }

    return (longIntervalo / 3) * acumula;
}

// Implementación de la cuadratura de Gauss-Legendre
function CuadraturaGaussLegendre(coef, xIni, xFin) {
    const x = [-1.0 / Math.sqrt(3), 1.0 / Math.sqrt(3)];
    const w = [1.0, 1.0];

    const c1 = (xFin - xIni) / 2.0;
    const c2 = (xFin + xIni) / 2.0;

    let integral = 0.0;
    for (let i = 0; i < x.length; i++) {
        integral += w[i] * Ecuacion(coef, c1 * x[i] + c2);
    }

    return c1 * integral;
}

// Función para encontrar los puntos de corte (ceros de la función) en un intervalo dado
function EncuentraCortes(coef, xIni, xFin, tolerancia) {
    const cortes = [];
    const paso = (xFin - xIni) / 1000; // Dividir el intervalo en pasos pequeños

    // Recorre el intervalo buscando cambios de signo en la función
    for (let x = xIni; x < xFin; x += paso) {
        const fXa = Ecuacion(coef, x);
        const fXb = Ecuacion(coef, x + paso);
        if (fXa * fXb <= 0) {
            const corte = MetodoBiseccion(coef, x, x + paso, tolerancia);
            cortes.push(corte);
        }
    }
    return cortes;
}

// Método de bisección para encontrar un cero de la función en un intervalo dado con cierta tolerancia
function MetodoBiseccion(coef, xIni, xFin, tolerancia) {
    let fXa = Ecuacion(coef, xIni);
    let xMedio = xIni;

    // Realiza la bisección hasta que el intervalo sea menor que la tolerancia
    while ((xFin - xIni) / 2.0 > tolerancia) {
        xMedio = (xIni + xFin) / 2.0;
        const fXMedio = Ecuacion(coef, xMedio);
        if (fXMedio === 0.0) break;
        else if (fXa * fXMedio < 0) xFin = xMedio;
        else {
            xIni = xMedio;
            fXa = fXMedio;
        }
    }
    return xMedio;
}

// Función principal que coordina el cálculo y el envío de datos entre JavaScript y PHP
async function calcular() {
    const coef = [
        parseFloat(document.getElementById('coefA').value),
        parseFloat(document.getElementById('coefB').value),
        parseFloat(document.getElementById('coefC').value),
        parseFloat(document.getElementById('coefD').value),
        parseFloat(document.getElementById('coefE').value),
        parseFloat(document.getElementById('coefF').value),
        parseFloat(document.getElementById('coefG').value),
    ];

    // Obtener los valores iniciales y finales del intervalo y la tolerancia
    const xIni = parseFloat(document.getElementById('Xini').value);
    const xFin = parseFloat(document.getElementById('Xfin').value);
    const tolerancia = 0.001;
    const intervalos = 10000;

    // Encuentra los puntos de corte de la función en el intervalo dado
    const cortes = EncuentraCortes(coef, xIni, xFin, tolerancia);

    // Asegurarse de incluir el punto final del intervalo
    if (cortes.length === 0 || cortes[cortes.length - 1] !== xFin) {
        cortes.push(xFin);
    }

    // Variables para almacenar los resultados acumulados
    let resultados = [];
    let totalAreaJS = 0;
    let totalAreaPHP = 0;
    let totalTimeJS = 0;
    let totalTimePHP = 0;

    // Iterar sobre los puntos de corte para calcular áreas en cada subintervalo
    for (let i = 0; i < cortes.length; i++) {
        const puntoCorte1 = i === 0 ? xIni : cortes[i - 1];
        const puntoCorte2 = cortes[i];

        // Calcular el área promedio en JavaScript usando varios métodos de integración
        const startJS = performance.now();
        const areaGauss = Math.abs(CuadraturaGaussLegendre(coef, puntoCorte1, puntoCorte2));
        const areaTrapecio = Math.abs(ReglaTrapecio(coef, puntoCorte1, puntoCorte2, intervalos));
        const areaRiemann = Math.abs(SumaRiemann(coef, puntoCorte1, puntoCorte2, intervalos));
        const areaSimpson = Math.abs(ReglaSimpson(coef, puntoCorte1, puntoCorte2, intervalos));
        const endJS = performance.now();

        const areaPromedioJS = (areaGauss + areaTrapecio + areaRiemann + areaSimpson) / 4;

        // Enviar solicitud a PHP para obtener el área
        const startPHP = performance.now();
        const response = await fetch('calculo.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coef: coef,
                xIni: puntoCorte1,
                xFin: puntoCorte2,
                intervalos: intervalos
            })
        });
        const data = await response.json();
        const endPHP = performance.now();

        // Calcular área promedio y tiempos
        const areaPromedioPHP = data.areaPromedioPHP;
        const tiempoJS = (endJS - startJS).toFixed(2) + " ms";
        const tiempoPHP = (endPHP - startPHP).toFixed(2) + " ms";

        // Acumular resultados
        resultados.push({
            corte1: puntoCorte1,
            corte2: puntoCorte2,
            areaJS: areaPromedioJS,
            tiempoJS: tiempoJS,
            areaPHP: areaPromedioPHP,
            tiempoPHP: tiempoPHP
        });

        // Acumular los resultados totales
        totalAreaJS += areaPromedioJS;
        totalAreaPHP += areaPromedioPHP;
        totalTimeJS += parseFloat(tiempoJS);
        totalTimePHP += parseFloat(tiempoPHP);
    }

    // Mostrar los resultados en una tabla
    mostrarResultados(resultados, totalAreaJS, totalTimeJS, totalAreaPHP, totalTimePHP);
}

// Función para mostrar los resultados en una tabla HTML
function mostrarResultados(resultados, totalAreaJS, totalTimeJS, totalAreaPHP, totalTimePHP) {
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = ''; // Limpiar resultados anteriores

    // Insertar cada resultado como una fila en la tabla
    resultados.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">${result.corte1.toFixed(4)}</td>
            <td class="text-center">${result.corte2.toFixed(4)}</td>
            <td class="text-center">${result.areaJS.toFixed(4)}</td>
            <td class="text-center">${result.tiempoJS}</td>
            <td class="text-center">${result.areaPHP.toFixed(4)}</td>
            <td class="text-center">${result.tiempoPHP}</td>
        `;
        tbody.appendChild(row);
    });

    // Mostrar área total y tiempos en la fila final alineada con las demás filas
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td>Total</td>
        <td></td> <!-- Columna vacía para alinear con el total -->
        <td class="text-center"><strong>${totalAreaJS.toFixed(4)}</strong></td>
        <td class="text-center"><strong>${totalTimeJS.toFixed(2)} ms</strong></td>
        <td class="text-center"><strong>${totalAreaPHP.toFixed(4)}</strong></td>
        <td class="text-center"><strong>${totalTimePHP.toFixed(2)} ms</strong></td>
    `;
    tbody.appendChild(totalRow);
}