// Конфигурация API
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'e37212a5-2fcd-48e2-a620-995a5eda4ea2';

// Глобальные переменные
let allOrders = [];
let allCourses = [];
let allTutors = [];
let currentPage = 1;
const ORDERS_PER_PAGE = 5;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    init();
});

async function init() {
    try {
        await Promise.all([
            loadOrders(),
            loadCourses(),
            loadTutors()
        ]);
        setupEventListeners();
    } catch (error) {
        showNotification('Ошибка при загрузке данных', 'danger');
        console.error('Ошибка инициализации:', error);
    }
}

// Загрузка заявок
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки заявок');
        
        allOrders = await response.json();
        
        displayOrders(currentPage);
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        throw error;
    }
}

// Загрузка курсов
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/courses?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки курсов');
        
        allCourses = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
        throw error;
    }
}

// Загрузка репетиторов
async function loadTutors() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tutors?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки репетиторов');
        
        allTutors = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки репетиторов:', error);
        throw error;
    }
}

// Форматирование даты в дд.мм.гггг
function formatDateToDMY(dateString) {
    if (!dateString) return 'Не указано';
    
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (error) {
        return dateString;
    }
}

// Форматирование времени без секунд
function formatTimeWithoutSeconds(timeString) {
    if (!timeString) return 'Не указано';
    
    try {
        // Если время в формате "HH:MM:SS", обрезаем секунды
        if (timeString.includes(':')) {
            const parts = timeString.split(':');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}`;
            }
        }
        return timeString;
    } catch (error) {
        return timeString;
    }
}

// Форматирование даты и времени
function formatDateTime(dateString) {
    if (!dateString) return 'Не указано';
    
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
        return dateString;
    }
}

// Расчет даты окончания курса
function calculateCourseEndDate(startDate, course) {
    if (!startDate || !course) return '';
    
    try {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + (course.total_length * 7));
        return formatDateToDMY(end.toISOString().split('T')[0]);
    } catch (error) {
        return '';
    }
}

// Получение полного названия заявки
function getFullOrderName(order) {
    if (order.course_id && order.course_id > 0) {
        const course = allCourses.find(c => c.id === order.course_id);
        return course ? course.name : `Курс #${order.course_id}`;
    } else if (order.tutor_id && order.tutor_id > 0) {
        const tutor = allTutors.find(t => t.id === order.tutor_id);
        return tutor ? tutor.name : `Репетитор #${order.tutor_id}`;
    }
    return 'Неизвестная заявка';
}

// Получение типа заявки
function getOrderType(order) {
    return order.course_id && order.course_id > 0 ? 'Курс' : 'Репетитор';
}

// Получение информации о курсе или репетиторе
function getOrderDetails(order) {
    if (order.course_id && order.course_id > 0) {
        return allCourses.find(c => c.id === order.course_id);
    } else if (order.tutor_id && order.tutor_id > 0) {
        return allTutors.find(t => t.id === order.tutor_id);
    }
    return null;
}

// Отображение заявок с пагинацией
function displayOrders(page = 1) {
    const tableBody = document.getElementById('orders-table-body');
    const pagination = document.getElementById('orders-pagination');
    
    if (!tableBody || !pagination) return;
    
    // Рассчитываем индексы для текущей страницы
    const startIndex = (page - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const pageOrders = allOrders.slice(startIndex, endIndex);
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    if (pageOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="alert alert-info mb-0">
                        У вас пока нет заявок. <a href="index.html" class="alert-link">Создать заявку</a>
                    </div>
                </td>
            </tr>
        `;
        pagination.innerHTML = '';
        return;
    }
    
    // Заполняем таблицу
    pageOrders.forEach((order, index) => {
        const row = createOrderRow(order, startIndex + index + 1);
        tableBody.innerHTML += row;
    });
    
    // Создаем пагинацию
    createPagination(pagination, allOrders.length, page, 'orders');
}

// Создание строки таблицы заявок
function createOrderRow(order, rowNumber) {
    const orderName = getFullOrderName(order);
    const orderType = getOrderType(order);
    const formattedDate = formatDateToDMY(order.date_start);
    const formattedTime = formatTimeWithoutSeconds(order.time_start);
    
    return `
        <tr class="fade-in" data-order-id="${order.id}">
            <td>${rowNumber}</td>
            <td>
                <strong>${orderName}</strong><br>
                <small class="text-muted">${orderType}</small>
            </td>
            <td>${formattedDate} ${formattedTime}</td>
            <td><span class="badge bg-success">${order.price.toLocaleString('ru-RU')} руб.</span></td>
            <td data-label="Действия">
                <div class="btn-group-actions">
                    <button class="btn btn-icon btn-icon-view" onclick="viewOrder(${order.id})" 
                            title="Подробнее">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-icon btn-icon-edit" onclick="editOrder(${order.id})" 
                            title="Изменить">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-icon btn-icon-delete" onclick="confirmDelete(${order.id})" 
                            title="Удалить">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Создание пагинации
function createPagination(element, totalItems, currentPage, type) {
    const totalPages = Math.ceil(totalItems / ORDERS_PER_PAGE);
    
    element.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Кнопка "Назад"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="changeOrdersPage(${currentPage - 1})">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    element.appendChild(prevLi);
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `
            <a class="page-link" href="#" onclick="changeOrdersPage(${i})">
                ${i}
            </a>
        `;
        element.appendChild(li);
    }
    
    // Кнопка "Вперед"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="changeOrdersPage(${currentPage + 1})">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    element.appendChild(nextLi);
}

// Смена страницы заказов
function changeOrdersPage(page) {
    currentPage = page;
    displayOrders(currentPage);
}

// Просмотр заявки
async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки заявки');
        
        const order = await response.json();
        showOrderDetails(order);
        
        const modal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
        modal.show();
    } catch (error) {
        console.error('Ошибка просмотра заявки:', error);
        showNotification('Ошибка при загрузке заявки', 'danger');
    }
}

// Показать детали заявки
function showOrderDetails(order) {
    const container = document.getElementById('order-details');
    if (!container) return;
    
    const orderName = getFullOrderName(order);
    const orderType = getOrderType(order);
    const details = getOrderDetails(order);
    const formattedDate = formatDateToDMY(order.date_start);
    const formattedTime = formatTimeWithoutSeconds(order.time_start);
    
    let detailsHtml = '';
    let courseDurationHtml = '';
    
    if (details) {
        if (order.course_id) {
            // Для курса
            const endDate = calculateCourseEndDate(order.date_start, details);
            detailsHtml = `
                <p><strong>Уровень:</strong> <span class="badge bg-primary">${details.level}</span></p>
                <p><strong>Часов в неделю:</strong> ${details.week_length}</p>
                <p><strong>Преподаватель:</strong> ${details.teacher}</p>
            `;
            
            // Продолжительность курса
            courseDurationHtml = `
                <div class="mb-4">
                    <h6>Продолжительность курса</h6>
                    <p><strong>${details.total_length} недель, последнее занятие: ${endDate}</strong></p>
                </div>
            `;
        } else {
            // Для репетитора
            detailsHtml = `
                <p><strong>Уровень:</strong> <span class="badge bg-primary">${details.language_level}</span></p>
                <p><strong>Опыт:</strong> ${details.work_experience} лет</p>
                <p><strong>Языки:</strong> ${details.languages_offered.join(', ')}</p>
            `;
        }
    }
    
    // Автоматические опции
    const startDateObj = new Date(order.date_start);
    const today = new Date();
    const monthLater = new Date(today);
    monthLater.setMonth(today.getMonth() + 1);
    const isEarlyRegistration = startDateObj > monthLater;
    const isGroupEnrollment = order.persons >= 5;
    const isIntensiveCourse = details && details.week_length >= 5;
    
    // Собираем HTML для дополнительных опций
    const optionsHtml = `
        <div class="d-flex flex-wrap gap-2">
            ${isEarlyRegistration ? '<span class="badge bg-info">Ранняя регистрация (-10%)</span>' : ''}
            ${isGroupEnrollment ? '<span class="badge bg-info">Групповая запись (-15%)</span>' : ''}
            ${isIntensiveCourse ? '<span class="badge bg-info">Интенсивный курс (+20%)</span>' : ''}
            ${order.supplementary ? '<span class="badge bg-info">Доп. материалы (+2000 руб./студент)</span>' : ''}
            ${order.personalized ? '<span class="badge bg-info">Индивидуальные занятия (+1500 руб./неделю)</span>' : ''}
            ${order.excursions ? '<span class="badge bg-info">Экскурсии (+25%)</span>' : ''}
            ${order.assessment ? '<span class="badge bg-info">Оценка уровня (+300 руб.)</span>' : ''}
            ${order.interactive ? '<span class="badge bg-info">Интерактивная платформа (+50%)</span>' : ''}
        </div>
    `;
    
    container.innerHTML = `
        <div class="mb-4">
            <h6>Информация о заявке</h6>
            <p><strong>Тип:</strong> ${orderType}</p>
            <p><strong>Название:</strong> ${orderName}</p>
            ${detailsHtml}
        </div>
        
        <div class="mb-4">
            <h6>Детали занятий</h6>
            <p><strong>Дата начала:</strong> ${formattedDate}</p>
            <p><strong>Время начала:</strong> ${formattedTime}</p>
            <p><strong>Продолжительность занятия:</strong> ${order.duration} час(ов)</p>
            ${order.course_id ? `<p><strong>Количество студентов:</strong> ${order.persons}</p>` : ''}
        </div>
        
        ${courseDurationHtml}
        
        <div class="mb-4">
            <h6>Дополнительные опции</h6>
            ${optionsHtml}
        </div>
        
        <div class="mb-4">
            <h6>Итого</h6>
            <h4 class="text-success">${order.price.toLocaleString('ru-RU')} руб.</h4>
        </div>
        
        <div class="alert alert-light">
            <small>
                <strong>Дата создания:</strong> ${formatDateTime(order.created_at)}<br>
                <strong>Последнее обновление:</strong> ${formatDateTime(order.updated_at)}
            </small>
        </div>
    `;
}

// Расчет стоимости курса
function calculateCoursePrice(order, course, dateStart, timeStart, persons, options) {
    if (!course || !dateStart || !timeStart) return 0;
    
    try {
        // Базовая стоимость за час
        const courseFeePerHour = course.course_fee_per_hour;
        
        // Общая продолжительность в часах
        const durationInHours = course.total_length * course.week_length;
        
        // Коэффициент выходных/праздничных дней
        const dateObj = new Date(dateStart);
        const day = dateObj.getDay(); // 0 - воскресенье, 6 - суббота
        const isWeekendOrHoliday = (day === 0 || day === 6) ? 1.5 : 1;
        
        // Доплаты за время
        const hour = parseInt(timeStart.split(':')[0]);
        let morningSurcharge = 0;
        let eveningSurcharge = 0;
        
        if (hour >= 9 && hour < 12) morningSurcharge = 400;
        if (hour >= 18 && hour < 20) eveningSurcharge = 1000;
        
        // Базовая стоимость
        let totalPrice = (courseFeePerHour * durationInHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge;
        
        // Умножаем на количество студентов
        totalPrice = totalPrice * persons;
        
        // Автоматические скидки
        const startDateObj = new Date(dateStart);
        const today = new Date();
        const monthLater = new Date(today);
        monthLater.setMonth(today.getMonth() + 1);
        const isEarlyRegistration = startDateObj > monthLater;
        const isGroupEnrollment = persons >= 5;
        const isIntensiveCourse = course.week_length >= 5;
        
        // Применяем автоматические опции
        if (isEarlyRegistration) totalPrice *= 0.9; // -10%
        if (isGroupEnrollment) totalPrice *= 0.85; // -15%
        if (isIntensiveCourse) totalPrice *= 1.2; // +20%
        
        // Применяем пользовательские опции
        if (options.supplementary) totalPrice += 2000 * persons; // Доп. материалы
        if (options.personalized) totalPrice += 1500 * course.total_length; // Инд. занятия
        if (options.excursions) totalPrice *= 1.25; // Экскурсии
        if (options.assessment) totalPrice += 300; // Оценка уровня
        if (options.interactive) totalPrice *= 1.5; // Интерактивная платформа
        
        return Math.round(totalPrice);
    } catch (error) {
        console.error('Ошибка расчета стоимости курса:', error);
        return order.price;
    }
}

// Расчет стоимости репетитора (всегда для 1 студента)
function calculateTutorPrice(order, tutor, duration) {
    if (!tutor) return order.price;
    
    try {
        return tutor.price_per_hour * duration;
    } catch (error) {
        console.error('Ошибка расчета стоимости репетитора:', error);
        return order.price;
    }
}

// Заполнение дат начала курса из API
function fillCourseStartDates(dateSelect, course) {
    if (!dateSelect || !course) return;
    
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';
    
    if (course.start_dates && course.start_dates.length > 0) {
        // Извлекаем уникальные даты
        const uniqueDates = [...new Set(course.start_dates.map(dateTime => {
            return dateTime.split('T')[0]; // YYYY-MM-DD
        }))];
        
        // Сортируем даты по возрастанию
        uniqueDates.sort();
        
        uniqueDates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = formatDateToDMY(date);
            dateSelect.appendChild(option);
        });
    }
}

// Заполнение времени для выбранной даты из API
function fillCourseStartTimes(timeSelect, selectedDate, course) {
    if (!timeSelect || !selectedDate || !course) return;
    
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    
    if (course.start_dates && course.start_dates.length > 0) {
        // Фильтруем времена для выбранной даты
        const timesForDate = course.start_dates.filter(dateTime => {
            return dateTime.startsWith(selectedDate);
        });
        
        // Получаем уникальные времена начала
        const uniqueStartTimes = [...new Set(timesForDate.map(dateTime => {
            const time = dateTime.split('T')[1].substring(0, 8); // HH:MM:SS
            return time.substring(0, 5); // Берем только HH:MM
        }))];
        
        // Сортируем времена
        uniqueStartTimes.sort();
        
        // Добавляем каждое время
        uniqueStartTimes.forEach(startTime => {
            const option = document.createElement('option');
            option.value = startTime;
            option.textContent = startTime;
            timeSelect.appendChild(option);
        });
    }
}

// Редактирование заявки
async function editOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки заявки');
        
        const order = await response.json();
        const details = getOrderDetails(order);
        
        // Заполняем форму редактирования
        document.getElementById('edit-order-id').value = order.id;
        
        // Для курса
        if (order.course_id && details) {
            // Показываем блок для курса, скрываем для репетитора
            document.getElementById('edit-course-block').style.display = 'block';
            document.getElementById('edit-tutor-block').style.display = 'none';
            document.getElementById('edit-course-options').style.display = 'block';
            
            // Заполняем даты из API
            fillCourseStartDates(document.getElementById('edit-course-start-date'), details);
            document.getElementById('edit-course-start-date').value = order.date_start;
            
            // Заполняем времена для выбранной даты
            fillCourseStartTimes(document.getElementById('edit-course-start-time'), order.date_start, details);
            document.getElementById('edit-course-start-time').value = formatTimeWithoutSeconds(order.time_start);
            
            // Заполняем количество студентов (только для курсов)
            document.getElementById('edit-course-persons').value = order.persons;
            
            // Заполняем пользовательские опции (только для курсов)
            document.getElementById('edit-supplementary').checked = order.supplementary;
            document.getElementById('edit-personalized').checked = order.personalized;
            document.getElementById('edit-excursions').checked = order.excursions;
            document.getElementById('edit-assessment').checked = order.assessment;
            document.getElementById('edit-interactive').checked = order.interactive;
            
            // Сохраняем информацию о курсе для расчета
            document.getElementById('edit-course-block').dataset.courseData = JSON.stringify(details);
        } 
        // Для репетитора
        else if (order.tutor_id && details) {
            // Показываем блок для репетитора, скрываем для курса
            document.getElementById('edit-course-block').style.display = 'none';
            document.getElementById('edit-tutor-block').style.display = 'block';
            document.getElementById('edit-course-options').style.display = 'none';
            
            // Заполняем поля для репетитора
            document.getElementById('edit-tutor-start-date').value = order.date_start;
            document.getElementById('edit-tutor-start-time').value = formatTimeWithoutSeconds(order.time_start);
            document.getElementById('edit-tutor-duration').value = order.duration;
            
            // Для репетитора дополнительные опции не применяются
            document.getElementById('edit-supplementary').checked = false;
            document.getElementById('edit-personalized').checked = false;
            document.getElementById('edit-excursions').checked = false;
            document.getElementById('edit-assessment').checked = false;
            document.getElementById('edit-interactive').checked = false;
            
            // Сохраняем информацию о репетиторе для расчета
            document.getElementById('edit-tutor-block').dataset.tutorData = JSON.stringify(details);
        }
        
        // Рассчитываем и отображаем начальную стоимость
        calculateEditPrice();
        
        // Настраиваем обработчики для пересчета стоимости
        setupEditFormListeners(order, details);
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        modal.show();
        
    } catch (error) {
        console.error('Ошибка редактирования заявки:', error);
        showNotification('Ошибка при загрузке заявки', 'danger');
    }
}

// Расчет стоимости при редактировании
function calculateEditPrice() {
    const orderId = document.getElementById('edit-order-id').value;
    const order = allOrders.find(o => o.id == orderId);
    if (!order) return;
    
    let price = order.price;
    
    // Если это курс
    if (order.course_id) {
        const courseBlock = document.getElementById('edit-course-block');
        if (courseBlock.style.display === 'block') {
            const courseData = JSON.parse(courseBlock.dataset.courseData || '{}');
            const dateStart = document.getElementById('edit-course-start-date').value;
            const timeStart = document.getElementById('edit-course-start-time').value;
            const persons = parseInt(document.getElementById('edit-course-persons').value || 1);
            
            if (dateStart && timeStart && persons && courseData) {
                const options = {
                    supplementary: document.getElementById('edit-supplementary').checked,
                    personalized: document.getElementById('edit-personalized').checked,
                    excursions: document.getElementById('edit-excursions').checked,
                    assessment: document.getElementById('edit-assessment').checked,
                    interactive: document.getElementById('edit-interactive').checked
                };
                
                price = calculateCoursePrice(order, courseData, dateStart, timeStart, persons, options);
            }
        }
    } 
    // Если это репетитор
    else if (order.tutor_id) {
        const tutorBlock = document.getElementById('edit-tutor-block');
        if (tutorBlock.style.display === 'block') {
            const tutorData = JSON.parse(tutorBlock.dataset.tutorData || '{}');
            const duration = parseInt(document.getElementById('edit-tutor-duration').value || 1);
            
            if (tutorData && duration) {
                // Для репетитора всегда расчет для 1 студента
                price = calculateTutorPrice(order, tutorData, duration);
            }
        }
    }
    
    document.getElementById('edit-total-price').textContent = price.toLocaleString('ru-RU');
}

// Настройка обработчиков для формы редактирования
function setupEditFormListeners(order, details) {
    // Для курса
    if (order.course_id && details) {
        const dateSelect = document.getElementById('edit-course-start-date');
        const timeSelect = document.getElementById('edit-course-start-time');
        
        if (dateSelect) {
            dateSelect.addEventListener('change', function() {
                fillCourseStartTimes(timeSelect, this.value, details);
                calculateEditPrice();
            });
        }
        
        if (timeSelect) {
            timeSelect.addEventListener('change', calculateEditPrice);
        }
        
        // Количество студентов для курса
        const personsInput = document.getElementById('edit-course-persons');
        if (personsInput) {
            personsInput.addEventListener('input', calculateEditPrice);
        }
        
        // Чекбоксы опций только для курсов
        const checkboxes = ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(`edit-${id}`);
            if (checkbox) {
                checkbox.addEventListener('change', calculateEditPrice);
            }
        });
    }
    
    // Для репетитора
    if (order.tutor_id) {
        const durationInput = document.getElementById('edit-tutor-duration');
        if (durationInput) {
            durationInput.addEventListener('input', calculateEditPrice);
        }
        
        const dateInput = document.getElementById('edit-tutor-start-date');
        if (dateInput) {
            dateInput.addEventListener('change', calculateEditPrice);
        }
        
        const timeInput = document.getElementById('edit-tutor-start-time');
        if (timeInput) {
            timeInput.addEventListener('change', calculateEditPrice);
        }
    }
}

// Подтверждение удаления
function confirmDelete(orderId) {
    document.getElementById('delete-order-id').value = orderId;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

// Удаление заявки
async function deleteOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка удаления заявки');
        }
        
        // Удаляем заявку из списка
        allOrders = allOrders.filter(order => order.id !== orderId);
        
        // Обновляем отображение
        displayOrders(currentPage);
        
        showNotification('Заявка успешно удалена', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления заявки:', error);
        showNotification(error.message || 'Ошибка при удалении заявки', 'danger');
    }
}

// Сохранение изменений заявки
async function saveEditedOrder() {
    try {
        const orderId = document.getElementById('edit-order-id').value;
        const order = allOrders.find(o => o.id == orderId);
        if (!order) {
            throw new Error('Заявка не найдена');
        }
        
        let updateData = {};
        let price = parseInt(document.getElementById('edit-total-price').textContent.replace(/[^\d]/g, ''));
        
        // Для курса
        if (order.course_id) {
            const dateStart = document.getElementById('edit-course-start-date').value;
            const timeStart = document.getElementById('edit-course-start-time').value;
            const persons = parseInt(document.getElementById('edit-course-persons').value);
            
            if (!dateStart || !timeStart) {
                showNotification('Выберите дату и время начала курса', 'warning');
                return;
            }
            
            if (!persons || persons < 1 || persons > 20) {
                showNotification('Количество студентов должно быть от 1 до 20', 'warning');
                return;
            }
            
            updateData = {
                date_start: dateStart,
                time_start: timeStart + ':00', // Добавляем секунды для API
                persons: persons,
                price: price,
                supplementary: document.getElementById('edit-supplementary').checked,
                personalized: document.getElementById('edit-personalized').checked,
                excursions: document.getElementById('edit-excursions').checked,
                assessment: document.getElementById('edit-assessment').checked,
                interactive: document.getElementById('edit-interactive').checked
            };
            
            // Автоматические опции для курса
            const startDateObj = new Date(dateStart);
            const today = new Date();
            const monthLater = new Date(today);
            monthLater.setMonth(today.getMonth() + 1);
            
            updateData.early_registration = startDateObj > monthLater;
            updateData.group_enrollment = persons >= 5;
            
            // Проверяем интенсивный курс
            const course = getOrderDetails(order);
            if (course) {
                updateData.intensive_course = course.week_length >= 5;
            }
        } 
        // Для репетитора
        else if (order.tutor_id) {
            const dateStart = document.getElementById('edit-tutor-start-date').value;
            const timeStart = document.getElementById('edit-tutor-start-time').value;
            const duration = parseInt(document.getElementById('edit-tutor-duration').value);
            
            if (!dateStart || !timeStart) {
                showNotification('Выберите дату и время занятия', 'warning');
                return;
            }
            
            if (!duration || duration < 1 || duration > 3) {
                showNotification('Продолжительность занятия должна быть от 1 до 3 часов', 'warning');
                return;
            }
            
            // Для репетитора всегда 1 студент
            const persons = 1;
            
            updateData = {
                date_start: dateStart,
                time_start: timeStart + ':00', // Добавляем секунды для API
                persons: persons,
                duration: duration,
                price: price,
                // Для репетитора дополнительные опции не применяются
                early_registration: false,
                group_enrollment: false,
                intensive_course: false,
                supplementary: false,
                personalized: false,
                excursions: false,
                assessment: false,
                interactive: false
            };
        }
        
        // Отправляем запрос
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка обновления заявки');
        }
        
        const updatedOrder = await response.json();
        
        // Обновляем заявку в списке
        const index = allOrders.findIndex(o => o.id === parseInt(orderId));
        if (index !== -1) {
            allOrders[index] = updatedOrder;
        }
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
        modal.hide();
        
        // Обновляем отображение
        displayOrders(currentPage);
        
        showNotification('Заявка успешно обновлена', 'success');
        
    } catch (error) {
        console.error('Ошибка сохранения изменений:', error);
        showNotification(error.message || 'Ошибка при обновлении заявки', 'danger');
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-area');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.appendChild(alert);
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        if (alert.parentNode) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }
    }, 5000);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Сохранение изменений заявки
    const saveBtn = document.getElementById('save-edit-order');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveEditedOrder);
    }
    
    // Подтверждение удаления
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            const orderId = document.getElementById('delete-order-id').value;
            if (orderId) {
                deleteOrder(orderId);
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
                modal.hide();
            }
        });
    }
}