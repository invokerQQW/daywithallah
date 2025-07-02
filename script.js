window.onload = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPrayerTimes, handleLocationError);
    } else {
        document.getElementById('location').textContent = "Геолокация не поддерживается этим браузером.";
    }

    // Ежедневный аят и хадис
    // Пример массивов. Можно расширять или брать из открытых API
    const ayahs = [
        {arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Воистину, с трудностями – облегчение (Сура аш-Шарх 94:6)"},
        {arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", translation: "Аллах — нет божества, кроме Него, Живого, Вседержителя (Аятуль Курси)"},
    ];
    const hadiths = [
        "Пророк Мухаммад (мир ему и благословение) сказал: «Лучший из вас тот, кто изучает Коран и обучает ему других». (Бухари)",
        "Посланник Аллаха сказал: «Легко относитесь к людям, не усложняйте им. Даруйте им радость и не отпугивайте» (Бухари и Муслим)",
    ];

    const today = new Date();
    const dayOfYear = Math.floor(
        (today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
    );
    const ayah = ayahs[dayOfYear % ayahs.length];
    const hadith = hadiths[dayOfYear % hadiths.length];

    document.getElementById('ayah').innerHTML = `<b>${ayah.arabic}</b><br>${ayah.translation}`;
    document.getElementById('hadith').textContent = hadith;
};

function showPrayerTimes(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    document.getElementById('location').textContent = `Ваше местоположение: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;

    fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`)
        .then(response => response.json())
        .then(data => {
            const timings = data.data.timings;
            let list = '';
            for (let key of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
                list += `<li><strong>${key}:</strong> ${timings[key]}</li>`;
            }
            document.getElementById('times-list').innerHTML = list;
        })
        .catch(() => {
            document.getElementById('times-list').textContent = 'Не удалось получить время намаза.';
        });
}

function handleLocationError(error) {
    document.getElementById('location').textContent = "Геолокация не определена.";
    document.getElementById('times-list').textContent = 'Время намаза не доступно.';
}
// =============== Исламский календарь ===============
const islamicMonths = [
    "Мухаррам", "Сафар", "Раби' аль-авваль", "Раби' ас-сани", "Джумад аль-уля", "Джумад ас-сани",
    "Раджаб", "Ша'бан", "Рамадан", "Шавваль", "Зу-ль-Ка'да", "Зу-ль-Хиджа"
];

const gregorianMonths = [
    "Январь","Февраль","Март","Апрель","Май","Июнь",
    "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

// Для конвертации используем Intl.DateTimeFormat (работает в современных браузерах)
function toIslamicDate(date) {
    try {
        const options = { calendar: "islamic", day: "numeric", month: "long", year: "numeric" };
        const islamic = new Intl.DateTimeFormat('ru-TN-u-ca-islamic', options).formatToParts(date);
        const day = islamic.find(x => x.type === 'day').value;
        const month = islamic.find(x => x.type === 'month').value;
        const year = islamic.find(x => x.type === 'year').value;
        return {day, month, year};
    } catch (e) {
        // Фолбек
        return {day: "-", month: "-", year: "-"};
    }
}

let calMonth = (new Date()).getMonth();
let calYear = (new Date()).getFullYear();

function renderCalendar(month, year) {
    const calendar = document.getElementById('calendar-table');
    const monthYearLabel = document.getElementById('calendar-month-year');
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Для России неделя начинается с понедельника
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let html = `<tr>${weekdays.map(d=>`<th>${d}</th>`).join('')}</tr><tr>`;

    let startDay = (firstDay + 6) % 7; // Смещаем: в JS 0=воскресенье, нам 0=понедельник
    for (let i = 0; i < startDay; i++) html += '<td></td>';

    const today = new Date();
    for (let date = 1; date <= daysInMonth; date++) {
        const current = new Date(year, month, date);
        const isToday = (date === today.getDate() && month === today.getMonth() && year === today.getFullYear());
        const islamic = toIslamicDate(current);

        html += `<td${isToday ? ' class="calendar-today"' : ''}>${date}
            <span class="islamic-date">${islamic.day} ${islamic.month.split(' ')[0]}</span>
        </td>`;

        if ((startDay + date) % 7 === 0 && date !== daysInMonth) html += '</tr><tr>';
    }
    // Дополнить пустыми ячейками
    let filled = (startDay + daysInMonth);
    for (let i = filled; i % 7 !== 0; i++) html += '<td></td>';
    html += '</tr>';

    calendar.innerHTML = html;

    // Отображаем название месяца и год
    monthYearLabel.textContent = `${gregorianMonths[month]} ${year}`;
}

// Кнопки
document.getElementById('prev-month').onclick = () => {
    if (calMonth === 0) { calMonth = 11; calYear--; } else { calMonth--; }
    renderCalendar(calMonth, calYear);
};
document.getElementById('next-month').onclick = () => {
    if (calMonth === 11) { calMonth = 0; calYear++; } else { calMonth++; }
    renderCalendar(calMonth, calYear);
};

renderCalendar(calMonth, calYear);
// ===== Ночной режим =====
const darkModeBtn = document.getElementById('dark-mode-toggle');

// Запоминаем выбор пользователя
if (localStorage.getItem('darkMode') === 'on') {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = "☀️";
}

darkModeBtn.onclick = function() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        darkModeBtn.textContent = "☀️";
        localStorage.setItem('darkMode', 'on');
    } else {
        darkModeBtn.textContent = "🌙";
        localStorage.setItem('darkMode', 'off');
    }
};
// Показать/скрыть кнопку "наверх" при прокрутке
const scrollBtn = document.getElementById('scrollToTopBtn');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        scrollBtn.classList.add('show');
    } else {
        scrollBtn.classList.remove('show');
    }
});
