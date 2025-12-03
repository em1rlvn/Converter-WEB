const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from');
const toSelect = document.getElementById('to');
const resultDiv = document.getElementById('result');
const rateDiv = document.getElementById('rate');
const updatedDiv = document.getElementById('updated');
const swapBtn = document.getElementById('swap');

// Список валют (все поддерживаются API)
const currencies = {
    USD: "Доллар США 🇺🇸",
    EUR: "Евро 🇪🇺",
    RUB: "Российский рубль 🇷🇺",
    KGS: "Киргизский сом 🇰🇬",
    GBP: "Британский фунт 🇬🇧",
    JPY: "Японская иена 🇯🇵",
    CNY: "Китайский юань 🇨🇳",
    KZT: "Казахстанский тенге 🇰🇿",
    UAH: "Украинская гривна 🇺🇦",
    BYN: "Белорусский рубль 🇧🇾",
    CHF: "Швейцарский франк 🇨🇭",
    CAD: "Канадский доллар 🇨🇦",
    AUD: "Австралийский доллар 🇦🇺",
    PLN: "Польский злотый 🇵🇱",
    TRY: "Турецкая лира 🇹🇷",
    INR: "Индийская рупия 🇮🇳"
};

// Заполняем <select>
Object.keys(currencies).forEach(code => {
    const opt1 = new Option(`${code} — ${currencies[code]}`, code);
    const opt2 = new Option(`${code} — ${currencies[code]}`, code);
    fromSelect.add(opt1);
    toSelect.add(opt2);
});

// По умолчанию
fromSelect.value = 'USD';
toSelect.value = 'RUB';

let rates = {};
let currentBase = 'USD';

// Fallback-курсы на 01.12.2025
const fallbackRates = {
    EUR: 0.9205,
    RUB: 97.8521,
    KGS: 89.1234,
    GBP: 0.7856,
    JPY: 151.2345,
    CNY: 7.1234,
    KZT: 485.6789,
    UAH: 41.5678,
    BYN: 3.1890,
    CHF: 0.8623,
    CAD: 1.3721,
    AUD: 1.4987,
    PLN: 3.9456,
    TRY: 34.5678,
    INR: 84.9123
};

// Загрузка курсов
async function loadRates(base = 'USD') {
    if (currentBase === base && Object.keys(rates).length > 0) {
        convert();
        return;
    }

    try {
        resultDiv.textContent = 'Загрузка курсов…';
        const res = await fetch(`https://api.exchangerate.host/latest?base=${base}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.rates) throw new Error('Нет данных');

        rates = data.rates;
        currentBase = base;
        updatedDiv.textContent = `Обновлено: ${new Date(data.date + 'T00:00:00').toLocaleString('ru-RU')}`;
        rateDiv.textContent = ''; // Очищаем ошибки
        convert();
    } catch (err) {
        console.warn('API ошибка (CORS?), fallback:', err);
        // Fallback: курсы от USD
        rates = { ...fallbackRates };
        currentBase = 'USD';
        updatedDiv.textContent = `Fallback: 01.12.2025 (API: ${err.message.includes('CORS') ? 'запустите через сервер' : 'проверьте интернет'})`;
        convert();
    }
}

// Конвертация
function convert() {
    const amount = parseFloat(amountInput.value) || 0;
    const from = fromSelect.value;
    const to = toSelect.value;

    if (amount === 0) {
        resultDiv.textContent = '—';
        return;
    }

    if (from === to) {
        resultDiv.textContent = amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${to}`;
        rateDiv.textContent = `1 ${from} = 1 ${to}`;
        return;
    }

    let rateTo;
    if (currentBase === from) {
        rateTo = rates[to] || 1;
    } else {
        // Кросс-курс: (1 / rates[from]) * rates[to] (но если база USD, просто rates[to]/rates[from])
        const rateFromBase = rates[from] || 1;
        rateTo = (1 / rateFromBase) * (rates[to] || 1);
    }

    const result = amount * rateTo;
    rateDiv.textContent = `1 ${from} = ${rateTo.toFixed(4)} ${to}`;

    resultDiv.innerHTML = result.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` <span style="font-size: 0.7em; opacity: 0.8;">${to}</span>`;
}

// Обмен
swapBtn.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    if (currentBase !== fromSelect.value) loadRates(fromSelect.value);
    else convert();
});

// События
amountInput.addEventListener('input', convert);
fromSelect.addEventListener('change', () => {
    if (currentBase !== fromSelect.value) loadRates(fromSelect.value);
    else convert();
});
toSelect.addEventListener('change', convert);

// Старт
loadRates();