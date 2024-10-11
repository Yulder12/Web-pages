<?php
header('Content-Type: application/json');

// Función que representa la ecuación, con verificación de división por cero
function Ecuacion($coef, $x) {
    // Verificación para evitar división por cero
    if ($coef[3] + sqrt(abs($x)) == 0) {
        throw new Exception("Error: División por cero al calcular la ecuación.");
    }

    // Si no hay división por cero, calcular la ecuación normalmente
    return $coef[0] * sin($x) + 
           $coef[1] * cos($x) + 
           ($coef[2] * pow($x, 2)) / ($coef[3] + sqrt(abs($x))) + 
           $coef[4] * pow($x, 3) + 
           $coef[5] * pow($x, 4) + 
           $coef[6];
}         

// Implementación de la regla del trapecio para la integración numérica
function reglaTrapecio($coef, $xIni, $xFin, $intervalos) {
    $longIntervalo = ($xFin - $xIni) / $intervalos;
    $acumula = 0.5 * (ecuacion($coef, $xIni) + ecuacion($coef, $xFin));

    // Calcula el área sumando el valor de la función en cada punto
    for ($i = 1; $i < $intervalos; $i++) {
        $valX = $xIni + $i * $longIntervalo;
        $acumula += ecuacion($coef, $valX);
    }

    return $acumula * $longIntervalo;
}

// Implementación de la suma de Riemann
function sumaRiemann($coef, $xIni, $xFin, $intervalos) {
    $longIntervalo = ($xFin - $xIni) / $intervalos;
    $acumula = 0.0;

    // Suma el valor de la función en cada subintervalo multiplicado por el tamaño del intervalo
    for ($i = 0; $i < $intervalos; $i++) {
        $valX = $xIni + $i * $longIntervalo;
        $acumula += ecuacion($coef, $valX) * $longIntervalo;
    }

    return $acumula;
}

// Implementación de la regla de Simpson
function reglaSimpson($coef, $xIni, $xFin, $intervalos) {
    if ($intervalos % 2 !== 0) {
        throw new Exception("El número de intervalos debe ser par");
    }

    $longIntervalo = ($xFin - $xIni) / $intervalos;
    $acumula = ecuacion($coef, $xIni) + ecuacion($coef, $xFin);

    // Alterna entre multiplicar por 4 y por 2 en los puntos intermedios
    for ($i = 1; $i < $intervalos; $i++) {
        $valX = $xIni + $i * $longIntervalo;
        $acumula += ($i % 2 === 0) ? 2 * ecuacion($coef, $valX) : 4 * ecuacion($coef, $valX);
    }

    return ($longIntervalo / 3) * $acumula;
}

// Implementación de la cuadratura de Gauss-Legendre
function cuadraturaGaussLegendre($coef, $xIni, $xFin) {
    $x = [-1.0 / sqrt(3), 1.0 / sqrt(3)];
    $w = [1.0, 1.0];

    $c1 = ($xFin - $xIni) / 2.0;
    $c2 = ($xFin + $xIni) / 2.0;

    $integral = 0.0;
    // Suma ponderada de los valores de la función en los puntos de evaluación
    foreach ($x as $i => $value) {
        $integral += $w[$i] * ecuacion($coef, $c1 * $value + $c2);
    }

    return $c1 * $integral;
}

// Captura los datos enviados desde el cliente en formato JSON
$data = json_decode(file_get_contents('php://input'), true);
$coef = $data['coef'];
$xIni = $data['xIni'];
$xFin = $data['xFin'];
$intervalos = $data['intervalos'];

// Mide el tiempo de ejecución del cálculo
$start = microtime(true);

// Calcula el área usando diferentes métodos$areaGauss = abs(cuadraturaGaussLegendre($coef, $xIni, $xFin));
$areaGauss = abs(cuadraturaGaussLegendre($coef, $xIni, $xFin));
$areaTrapecio = abs(reglaTrapecio($coef, $xIni, $xFin, $intervalos));
$areaRiemann = abs(sumaRiemann($coef, $xIni, $xFin, $intervalos));
$areaSimpson = abs(reglaSimpson($coef, $xIni, $xFin, $intervalos));

// Promedio de las áreas calculadas por los 4 métodos
$areaPromedioPHP = ($areaGauss + $areaTrapecio + $areaRiemann + $areaSimpson) / 4;

// Mide el tiempo de finalización
$end = microtime(true);
$tiempoPHP = ($end - $start) * 1000; // Convertir a milisegundos

// Devolver la respuesta en formato JSON
$response = [
    'areaGauss' => $areaGauss,
    'areaTrapecio' => $areaTrapecio,
    'areaRiemann' => $areaRiemann,
    'areaSimpson' => $areaSimpson,
    'areaPromedioPHP' => $areaPromedioPHP,
    'tiempoPHP' => $tiempoPHP
];

echo json_encode($response); // Enviar respuesta en formato JSON