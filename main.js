// Конфигурация API
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'e37212a5-2fcd-48e2-a620-995a5eda4ea2';

// Глобальные переменные
let allCourses = [];
let allTutors = [];
let filteredCourses = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// Текущий выбранный курс и репетитор
let selectedCourse = null;
let selectedTutor = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    init();
});

async function init() {
    try {
        await Promise.all([
            loadCourses(),
            loadTutors()
        ]);
        setupEventListeners();
        setupCourseOrderFormListeners();
        setupTutorRequestFormListeners();
        setupModalsReset();
    } catch (error) {
        showNotification('Ошибка при загрузке данных', 'danger');
        console.error('Ошибка инициализации:', error);
    }
}

// Сброс форм при открытии модальных окон
function setupModalsReset() {
    const courseOrderModal = document.getElementById('courseOrderModal');
    const tutorRequestModal = document.getElementById('tutorRequestModal');
    
    if (courseOrderModal) {
        courseOrderModal.addEventListener('show.bs.modal', function() {
            document.getElementById('course-selection-details').innerHTML = '';
            document.getElementById('total-price').textContent = '0 руб.';
            document.getElementById('price-breakdown').innerHTML = '<div>Выберите параметры для расчета стоимости</div>';
            
            // Заполняем выпадающий список курсов
            updateCourseSelect();
            
            // Блокируем выбор времени по умолчанию
            const timeSelect = document.getElementById('course-start-time');
            timeSelect.disabled = true;
            timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';

            // Если есть выбранный курс, устанавливаем его
            if (selectedCourse) {
                document.getElementById('course-select').value = selectedCourse.id;
                updateCourseSelectionDetails();
                fillCourseStartDates(selectedCourse);
                calculateCoursePrice();
            }
        });
    }
    
    if (tutorRequestModal) {
        tutorRequestModal.addEventListener('show.bs.modal', function() {
            document.getElementById('tutor-selection-details').innerHTML = '';
            document.getElementById('tutor-total-price').textContent = '0 руб.';
            document.getElementById('tutor-price-breakdown').innerHTML = 'Расчет: ставка × продолжительность';
            
            if (selectedTutor) {
                updateTutorSelectionDetails();
                calculateTutorPrice();
            }
        });
    }
}

// Загрузка курсов
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/courses?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки курсов');
        
        allCourses = await response.json();
        filteredCourses = [...allCourses];
        
        displayCourses(currentPage);
        setupCourseSearch();
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
        displayAllTutors();
        displayTutorsCards();
        setupTutorSearch();
    } catch (error) {
        console.error('Ошибка загрузки репетиторов:', error);
        throw error;
    }
}

// Отображение всех репетиторов в таблице
function displayAllTutors() {
    const tableBody = document.getElementById('tutors-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    allTutors.forEach(tutor => {
        const row = createTutorTableRow(tutor);
        tableBody.innerHTML += row;
    });
}

// Создание строки таблицы для репетитора
function createTutorTableRow(tutor) {
    const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return `
        <tr id="tutor-row-${tutor.id}" data-tutor-id="${tutor.id}">
            <td>
                <div class="tutor-photo" style="width: 40px; height: 40px; background-color: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                    ${initials}
                </div>
            </td>
            <td>
                <strong>${tutor.name}</strong>
            </td>
            <td>
                <span class="badge bg-primary">${tutor.language_level}</span>
            </td>
            <td>
                ${tutor.languages_offered.join(', ')}
                <br>
                <small class="text-muted">Владеет: ${tutor.languages_spoken.join(', ')}</small>
            </td>
            <td>${tutor.work_experience} лет</td>
            <td>
                <strong class="text-success">${tutor.price_per_hour} руб./час</strong>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="selectTutorForRequest(${tutor.id})">
                    Выбрать
                </button>
            </td>
        </tr>
    `;
}

// Отображение карточек репетиторов для мобильных устройств
function displayTutorsCards() {
    const cardsContainer = document.getElementById('tutors-cards-container');
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    allTutors.forEach(tutor => {
        const card = createTutorCard(tutor);
        cardsContainer.innerHTML += card;
    });
}

// Создание карточки репетитора для мобильных устройств
function createTutorCard(tutor) {
    const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return `
        <div class="col-12">
            <div class="card tutor-card" data-tutor-id="${tutor.id}">
                <div class="card-body">
                    <div class="d-flex align-items-start mb-3">
                        <div class="tutor-photo me-3" style="width: 50px; height: 50px; background-color: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">
                            ${initials}
                        </div>
                        <div>
                            <h5 class="card-title mb-1">${tutor.name}</h5>
                            <p class="card-text mb-1">
                                <span class="badge bg-primary">${tutor.language_level}</span>
                            </p>
                            <p class="card-text mb-1">
                                <small class="text-muted">Опыт: ${tutor.work_experience} лет</small>
                            </p>
                        </div>
                    </div>
                    
                    <p class="card-text mb-2">
                        <strong>Языки:</strong> ${tutor.languages_offered.join(', ')}
                    </p>
                    
                    <p class="card-text mb-3">
                        <small class="text-muted">Владеет: ${tutor.languages_spoken.join(', ')}</small>
                    </p>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-success">${tutor.price_per_hour} руб./час</span>
                        <button class="btn btn-sm btn-outline-primary" onclick="selectTutorForRequest(${tutor.id})">
                            Выбрать
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Отображение отфильтрованных репетиторов
function displayFilteredTutors(tutors) {
    // Обновляем таблицу для десктопов
    const tableBody = document.getElementById('tutors-table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        if (tutors.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="alert alert-info mb-0">
                            Репетиторы не найдены. Попробуйте изменить параметры поиска.
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tutors.forEach(tutor => {
                const row = createTutorTableRow(tutor);
                tableBody.innerHTML += row;
            });
        }
    }
    
    // Обновляем карточки для мобильных устройств
    const cardsContainer = document.getElementById('tutors-cards-container');
    if (cardsContainer) {
        cardsContainer.innerHTML = '';
        
        if (tutors.length === 0) {
            cardsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        Репетиторы не найдены. Попробуйте изменить параметры поиска.
                    </div>
                </div>
            `;
        } else {
            tutors.forEach(tutor => {
                const card = createTutorCard(tutor);
                cardsContainer.innerHTML += card;
            });
        }
    }
}

// Фильтрация репетиторов для выбранного курса
function filterTutorsForCourse(course) {
    if (!course) {
        return allTutors;
    }
    
    // Получаем список всех языков из курса
    const courseText = (course.name + ' ' + course.description + ' ' + course.teacher).toLowerCase();
    const tutorLanguages = getAllTutorLanguages();
    
    // Находим языки, упомянутые в курсе
    const mentionedLanguages = tutorLanguages.filter(lang => 
        courseText.includes(lang.toLowerCase())
    );
    
    // Фильтруем репетиторов по критериям:
    // 1. Имя преподавателя курса совпадает с именем репетитора
    // 2. Репетитор преподает язык, упомянутый в курсе
    const filtered = allTutors.filter(tutor => {
        // Проверяем совпадение имени
        const nameMatches = tutor.name.toLowerCase() === course.teacher.toLowerCase();
        
        // Проверяем совпадение языков
        const languageMatches = tutor.languages_offered.some(lang => 
            mentionedLanguages.includes(lang)
        );
        
        return nameMatches || languageMatches;
    });
    
    return filtered;
}

// Получение всех уникальных языков из репетиторов
function getAllTutorLanguages() {
    const languages = new Set();
    allTutors.forEach(tutor => {
        tutor.languages_offered.forEach(lang => languages.add(lang));
    });
    return Array.from(languages);
}

// Настройка поиска репетиторов
function setupTutorSearch() {
    const form = document.getElementById('tutor-search-form');
    if (!form) return;
    
    // Заполняем список языков
    const languageSelect = document.getElementById('tutor-qualification');
    const languages = getAllTutorLanguages();
    
    languages.sort().forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        filterTutorsByForm();
    });

    // Обработчик для кнопки
    const searchButton = document.getElementById('tutor-search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            filterTutorsByForm();
        });
    }
}

// Фильтрация репетиторов по форме
function filterTutorsByForm() {
    const language = document.getElementById('tutor-qualification').value;
    const level = document.getElementById('tutor-level-search').value;
    
    let filteredTutors = allTutors;
    
    // Если есть выбранный курс, сначала фильтруем по курсу
    if (selectedCourse) {
        filteredTutors = filterTutorsForCourse(selectedCourse);
    }
    
    // Затем применяем фильтры пользователя из формы
    if (language || level) {
        filteredTutors = filteredTutors.filter(tutor => {
            const matchesLanguage = !language || 
                tutor.languages_offered.includes(language);
            
            const matchesLevel = !level || 
                tutor.language_level === level;
            
            return matchesLanguage && matchesLevel;
        });
    }
    
    displayFilteredTutors(filteredTutors);
}

// Настройка обработчиков событий для формы заказа курса
function setupCourseOrderFormListeners() {
    // Выбор курса
    const courseSelect = document.getElementById('course-select');
    if (courseSelect) {
        courseSelect.addEventListener('change', function() {
            const courseId = this.value;
            selectedCourse = allCourses.find(c => c.id == courseId);
            
            if (selectedCourse) {
                // Заполняем даты начала из API
                fillCourseStartDates(selectedCourse);
                
                // Обновляем информацию вверху
                updateCourseSelectionDetails();
                
                // Показываем закрепленную полосу
                showFixedCourseBar(selectedCourse);
                
                // Фильтруем репетиторов для этого курса
                filterTutorsForSelectedCourse();
            }
            
            calculateCoursePrice();
        });
    }
    
    // Выбор даты начала курса
    const courseStartDate = document.getElementById('course-start-date');
    if (courseStartDate) {
        courseStartDate.addEventListener('change', function() {
            const selectedDate = this.value;
            const timeSelect = document.getElementById('course-start-time');
            
            if (selectedDate && selectedCourse) {
                // Включаем выбор времени
                timeSelect.disabled = false;
                
                // Заполняем времена для выбранной даты
                fillCourseStartTimes(selectedDate, selectedCourse);
                
                // Обновляем дату окончания курса
                updateCourseDurationDisplay(selectedDate);
            } else {
                timeSelect.disabled = true;
                timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
            }
            
            calculateCoursePrice();
        });
    }
    
    // Выбор времени курса
    const courseStartTime = document.getElementById('course-start-time');
    if (courseStartTime) {
        courseStartTime.addEventListener('change', calculateCoursePrice);
    }
    
    // Количество студентов
    const studentsNumber = document.getElementById('course-students-number');
    if (studentsNumber) {
        studentsNumber.addEventListener('input', calculateCoursePrice);
        studentsNumber.addEventListener('change', calculateCoursePrice);
    }
    
    // Чекбоксы опций
    const checkboxes = ['supplementary', 'interactive', 'personalized', 'excursions', 'assessment'];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', calculateCoursePrice);
        }
    });
}

// Настройка обработчиков событий для формы запроса репетитора
function setupTutorRequestFormListeners() {
    // Выбор даты репетитора
    const tutorStartDate = document.getElementById('tutor-start-date');
    if (tutorStartDate) {
        tutorStartDate.addEventListener('change', calculateTutorPrice);
    }
    
    // Выбор времени репетитора
    const tutorStartTime = document.getElementById('tutor-start-time');
    if (tutorStartTime) {
        tutorStartTime.addEventListener('change', calculateTutorPrice);
    }
    
    // Выбор продолжительности занятия с репетитором
    const tutorDuration = document.getElementById('tutor-duration');
    if (tutorDuration) {
        tutorDuration.addEventListener('change', calculateTutorPrice);
    }
}

// Заполнение дат начала курса из API
function fillCourseStartDates(course) {
    const dateSelect = document.getElementById('course-start-date');
    if (!dateSelect) return;
    
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
            
            // Форматируем дату для отображения
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            option.textContent = formattedDate;
            dateSelect.appendChild(option);
        });
    }
}

// Заполнение времени для выбранной даты
function fillCourseStartTimes(selectedDate, course) {
    const timeSelect = document.getElementById('course-start-time');
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    
    if (course.start_dates && course.start_dates.length > 0) {
        // Фильтруем времена для выбранной даты
        const timesForDate = course.start_dates.filter(dateTime => {
            return dateTime.startsWith(selectedDate);
        });
        
        // Получаем уникальные времена начала
        const uniqueStartTimes = [...new Set(timesForDate.map(dateTime => {
            return dateTime.split('T')[1].substring(0, 5); // HH:MM
        }))];
        
        // Сортируем времена
        uniqueStartTimes.sort();
        
        // Добавляем каждое время с доплатой, если есть
        uniqueStartTimes.forEach(startTime => {
            const option = document.createElement('option');
            option.value = startTime;
            
            // Добавляем информацию о доплате
            const hour = parseInt(startTime.split(':')[0]);
            let surcharge = '';
            if (hour >= 9 && hour < 12) {
                surcharge = ' (утро, +400 руб.)';
            } else if (hour >= 18 && hour < 20) {
                surcharge = ' (вечер, +1000 руб.)';
            }
            
            option.textContent = startTime + surcharge;
            timeSelect.appendChild(option);
        });
        
        if (uniqueStartTimes.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'На эту дату нет доступных времён';
            option.disabled = true;
            timeSelect.appendChild(option);
        }
    }
}

// Обновление отображения продолжительности курса
function updateCourseDurationDisplay(selectedDate = null) {
    const durationDisplay = document.getElementById('course-duration-display');
    if (!durationDisplay || !selectedCourse) return;
    
    let displayText = `${selectedCourse.total_length} недель`;
    
    if (selectedDate) {
        // Рассчитываем дату последнего занятия
        const startDate = new Date(selectedDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (selectedCourse.total_length * 7));
        
        const formattedEndDate = endDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        displayText += `, последнее занятие: ${formattedEndDate}`;
    }
    
    durationDisplay.textContent = displayText;
}

// Обновление информации о выбранном курсе
function updateCourseSelectionDetails() {
    const detailsContainer = document.getElementById('course-selection-details');
    
    if (!detailsContainer || !selectedCourse) return;
    
    const totalHours = selectedCourse.total_length * selectedCourse.week_length;
    detailsContainer.innerHTML = `
        <div class="card border-primary">
            <div class="card-body">
                <h5 class="card-title">${selectedCourse.name}</h5>
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-2"><strong>Преподаватель:</strong> ${selectedCourse.teacher}</p>
                        <p class="mb-2"><strong>Уровень:</strong> <span class="badge bg-primary">${selectedCourse.level}</span></p>
                    </div>
                    <div class="col-md-6">
                        <p class="mb-2"><strong>Продолжительность:</strong> ${selectedCourse.total_length} недель</p>
                        <p class="mb-2"><strong>Часов в неделю:</strong> ${selectedCourse.week_length}</p>
                    </div>
                </div>
                <p class="mb-0"><strong>Базовая стоимость:</strong> ${selectedCourse.course_fee_per_hour} руб./час (${totalHours} часов всего)</p>
            </div>
        </div>
    `;
}

// Обновление информации о выбранном репетиторе
function updateTutorSelectionDetails() {
    const detailsContainer = document.getElementById('tutor-selection-details');
    
    if (!detailsContainer || !selectedTutor) return;
    
    detailsContainer.innerHTML = `
        <div class="card border-primary">
            <div class="card-body">
                <h5 class="card-title">${selectedTutor.name}</h5>
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-2"><strong>Уровень:</strong> <span class="badge bg-primary">${selectedTutor.language_level}</span></p>
                        <p class="mb-2"><strong>Опыт:</strong> ${selectedTutor.work_experience} лет</p>
                    </div>
                    <div class="col-md-6">
                        <p class="mb-2"><strong>Языки:</strong> ${selectedTutor.languages_offered.join(', ')}</p>
                        <p class="mb-2"><strong>Владеет:</strong> ${selectedTutor.languages_spoken.join(', ')}</p>
                    </div>
                </div>
                <p class="mb-0"><strong>Ставка:</strong> ${selectedTutor.price_per_hour} руб./час</p>
            </div>
        </div>
    `;
}

// Показать закрепленную полосу с выбранным курсом
function showFixedCourseBar(course) {
    const fixedBar = document.getElementById('fixed-course-bar');
    if (!fixedBar) return;
    
    document.getElementById('fixed-course-name').textContent = course.name;
    document.getElementById('fixed-course-level').textContent = `Уровень: ${course.level}`;
    fixedBar.style.display = 'block';
    
    // Прокручиваем к репетиторам
    setTimeout(() => {
        document.getElementById('tutors').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Скрыть закрепленную полосу
function hideFixedCourseBar() {
    const fixedBar = document.getElementById('fixed-course-bar');
    if (fixedBar) {
        fixedBar.style.display = 'none';
    }
}

// Очистить выбранный курс
function clearSelectedCourse() {
    selectedCourse = null;
    hideFixedCourseBar();
    displayAllTutors();
    displayTutorsCards();
    
    // Сбрасываем фильтры поиска репетиторов
    document.getElementById('tutor-qualification').value = '';
    document.getElementById('tutor-level-search').value = '';
}

// Фильтрация репетиторов для выбранного курса
function filterTutorsForSelectedCourse() {
    if (!selectedCourse) {
        displayAllTutors();
        displayTutorsCards();
        return;
    }
    
    const filteredTutors = filterTutorsForCourse(selectedCourse);
    displayFilteredTutors(filteredTutors);
}

// Расчет стоимости курса
function calculateCoursePrice() {
    let totalPrice = 0;
    let priceBreakdown = [];
    
    try {
        if (selectedCourse) {
            const selectedDate = document.getElementById('course-start-date').value;
            const selectedTime = document.getElementById('course-start-time').value;
            const studentsNumber = parseInt(document.getElementById('course-students-number').value || 1);
            
            // Сбрасываем предыдущий расчет
            totalPrice = 0;
            priceBreakdown = [];

            if (selectedDate && selectedTime) {
                // Общая продолжительность в часах
                const durationInHours = selectedCourse.total_length * selectedCourse.week_length;
                
                // Базовая стоимость курса (без допов)
                const courseBasePrice = selectedCourse.course_fee_per_hour * durationInHours;
                totalPrice = courseBasePrice;
                priceBreakdown.push(`Базовая стоимость: ${selectedCourse.course_fee_per_hour} руб./час × ${durationInHours} часов = ${courseBasePrice} руб.`);
                
                // Количество студентов
                priceBreakdown.push(`Количество студентов: ${studentsNumber}`);
                
                // Коэффициент выходных
                let isWeekendOrHoliday = 1;
                
                const dateObj = new Date(selectedDate);
                const day = dateObj.getDay(); // 0 - воскресенье, 6 - суббота
                if (day === 0 || day === 6) {
                    isWeekendOrHoliday = 1.5;
                    priceBreakdown.push(`Выходной/праздничный: ×1.5`);
                }
                
                // Умножаем на коэффициент выходных
                totalPrice = totalPrice * isWeekendOrHoliday;
                
                // Доплаты за время
                const hour = parseInt(selectedTime.split(':')[0]);
                
                // Утренняя доплата
                if (hour >= 9 && hour < 12) {
                    totalPrice += 400;
                    priceBreakdown.push(`Утреннее время (9:00-12:00): +400 руб.`);
                }
                
                // Вечерняя доплата
                if (hour >= 18 && hour < 20) {
                    totalPrice += 1000;
                    priceBreakdown.push(`Вечернее время (18:00-20:00): +1000 руб.`);
                }
                
                // Умножаем на количество студентов
                let studentsPrice = totalPrice * studentsNumber;
                
                // Проверка ранней регистрации (автоматически)
                const startDateObj = new Date(selectedDate);
                const today = new Date();
                const monthLater = new Date(today);
                monthLater.setMonth(today.getMonth() + 1);
                
                const isEarlyRegistration = startDateObj > monthLater;
                
                // Автоматические опции
                const isGroupEnrollment = studentsNumber >= 5;
                const isIntensiveCourse = selectedCourse.week_length >= 5;
                
                // Применяем автоматические опции
                
                // Ранняя регистрация (-10%)
                if (isEarlyRegistration) {
                    studentsPrice *= 0.9;
                    priceBreakdown.push(`Ранняя регистрация: -10%`);
                }
                
                // Групповая скидка (15%)
                if (isGroupEnrollment) {
                    studentsPrice *= 0.85;
                    priceBreakdown.push(`Групповая скидка (5+ студентов): -15%`);
                }
                
                // Интенсивный курс (+20%)
                if (isIntensiveCourse) {
                    studentsPrice *= 1.2;
                    priceBreakdown.push(`Интенсивный курс (5+ часов в неделю): +20%`);
                }
                
                // Остальные опции (через чекбоксы)
                const supplementary = document.getElementById('supplementary')?.checked;
                const interactive = document.getElementById('interactive')?.checked;
                const personalized = document.getElementById('personalized')?.checked;
                const excursions = document.getElementById('excursions')?.checked;
                const assessment = document.getElementById('assessment')?.checked;
                
                // Дополнительные материалы (+2000 за каждого студента)
                if (supplementary) {
                    const supplementaryCost = 2000 * studentsNumber;
                    studentsPrice += supplementaryCost;
                    priceBreakdown.push(`Дополнительные материалы: +${supplementaryCost} руб.`);
                }
                
                // Индивидуальные занятия (+1500 за каждую неделю курса)
                if (personalized) {
                    const personalizedCost = 1500 * selectedCourse.total_length;
                    studentsPrice += personalizedCost;
                    priceBreakdown.push(`Индивидуальные занятия: +${personalizedCost} руб.`);
                }
                
                // Культурные экскурсии (+25%)
                if (excursions) {
                    studentsPrice *= 1.25;
                    priceBreakdown.push(`Культурные экскурсии: +25%`);
                }
                
                // Оценка уровня (+300)
                if (assessment) {
                    studentsPrice += 300;
                    priceBreakdown.push(`Оценка уровня: +300 руб.`);
                }
                
                // Интерактивная платформа (+50%)
                if (interactive) {
                    studentsPrice *= 1.5;
                    priceBreakdown.push(`Интерактивная платформа: +50%`);
                }
                
                // Округляем до целых рублей
                const finalPrice = Math.round(studentsPrice);
                
                // Отображаем стоимость
                const totalPriceElement = document.getElementById('total-price');
                if (totalPriceElement) {
                    totalPriceElement.textContent = `${finalPrice.toLocaleString('ru-RU')} руб.`;
                }
            }
        }
        
        // Отображаем детали расчета
        const priceBreakdownElement = document.getElementById('price-breakdown');
        if (priceBreakdownElement) {
            if (priceBreakdown.length > 0) {
                priceBreakdownElement.innerHTML = priceBreakdown.map(detail => `<div>${detail}</div>`).join('');
            } else {
                priceBreakdownElement.innerHTML = '<div>Выберите параметры для расчета стоимости</div>';
            }
        }
        
    } catch (error) {
        console.error('Ошибка расчета стоимости:', error);
        const totalPriceElement = document.getElementById('total-price');
        if (totalPriceElement) {
            totalPriceElement.textContent = 'Ошибка расчета';
        }
        
        const priceBreakdownElement = document.getElementById('price-breakdown');
        if (priceBreakdownElement) {
            priceBreakdownElement.innerHTML = '<div>Произошла ошибка при расчете</div>';
        }
    }
}

// Расчет стоимости репетитора
function calculateTutorPrice() {
    if (!selectedTutor) return;
    
    try {
        const duration = parseInt(document.getElementById('tutor-duration').value || 1);
        
        // Для репетитора всегда 1 студент
        const totalPrice = selectedTutor.price_per_hour * duration;
        
        // Отображаем стоимость
        const totalPriceElement = document.getElementById('tutor-total-price');
        if (totalPriceElement) {
            totalPriceElement.textContent = `${totalPrice.toLocaleString('ru-RU')} руб.`;
        }
        
        // Отображаем детали расчета
        const priceBreakdown = document.getElementById('tutor-price-breakdown');
        if (priceBreakdown) {
            priceBreakdown.innerHTML = `
                Расчет: ${selectedTutor.price_per_hour} руб./час × ${duration} часов = ${totalPrice} руб.
            `;
        }
        
    } catch (error) {
        console.error('Ошибка расчета стоимости репетитора:', error);
        const totalPriceElement = document.getElementById('tutor-total-price');
        if (totalPriceElement) {
            totalPriceElement.textContent = 'Ошибка расчета';
        }
    }
}

// Выбор репетитора для запроса
function selectTutorForRequest(tutorId) {
    // Снимаем выделение со всех строк
    document.querySelectorAll('#tutors-table-body tr').forEach(row => {
        row.classList.remove('table-primary');
    });
    
    // Снимаем выделение со всех карточек
    document.querySelectorAll('.tutor-card').forEach(card => {
        card.classList.remove('selected-tutor');
    });
    
    // Выделяем выбранную строку
    const selectedRow = document.getElementById(`tutor-row-${tutorId}`);
    if (selectedRow) {
        selectedRow.classList.add('table-primary');
    }
    
    // Выделяем выбранную карточку
    const selectedCard = document.querySelector(`.tutor-card[data-tutor-id="${tutorId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected-tutor');
    }
    
    // Устанавливаем выбранного репетитора
    selectedTutor = allTutors.find(t => t.id == tutorId);
    
    if (selectedTutor) {
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('tutorRequestModal'));
        modal.show();
    }
}

// Выбор курса (кнопка "Выбрать" на карточке курса)
function selectCourse(courseId) {
    selectedCourse = allCourses.find(c => c.id == courseId);
    
    if (selectedCourse) {
        // Показываем закрепленную полосу
        showFixedCourseBar(selectedCourse);
        
        // Фильтруем репетиторов для этого курса
        filterTutorsForSelectedCourse();
        
        // Сбрасываем фильтры поиска репетиторов
        document.getElementById('tutor-qualification').value = '';
        document.getElementById('tutor-level-search').value = '';
    }
}

// Записаться на курс (кнопка "Записаться" на карточке курса)
function enrollCourse(courseId) {
    selectedCourse = allCourses.find(c => c.id == courseId);
    
    if (selectedCourse) {
        // Заполняем выпадающий список курсов
        updateCourseSelect();
        
        // Устанавливаем выбранный курс
        document.getElementById('course-select').value = courseId;
        
        // Заполняем даты начала из API
        fillCourseStartDates(selectedCourse);
        
        // Обновляем информацию вверху
        updateCourseSelectionDetails();
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('courseOrderModal'));
        modal.show();
        
        // Рассчитываем стоимость
        calculateCoursePrice();
    }
}

// Отображение курсов с пагинацией
function displayCourses(page = 1) {
    const container = document.getElementById('courses-container');
    const pagination = document.getElementById('courses-pagination');
    
    if (!container || !pagination) return;
    
    // Рассчитываем индексы для текущей страницы
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageCourses = filteredCourses.slice(startIndex, endIndex);
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    if (pageCourses.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    Курсы не найдены. Попробуйте изменить параметры поиска.
                </div>
            </div>
        `;
        pagination.innerHTML = '';
        return;
    }
    
    // Отображаем курсы на текущей странице
    pageCourses.forEach(course => {
        const card = createCourseCard(course);
        container.innerHTML += card;
    });
    
    // Создаем пагинацию
    createPagination(pagination, filteredCourses.length, page, 'courses');
}

// Создание карточки курса
function createCourseCard(course) {
    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 fade-in">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <p class="card-text text-muted">
                        <small>${course.description.substring(0, 100)}...</small>
                    </p>
                    <div class="mb-3">
                        <span class="badge bg-primary">${course.level}</span>
                        <span class="badge bg-secondary ms-2">${course.total_length} недель</span>
                    </div>
                    <p class="card-text">
                        <strong>Преподаватель:</strong> ${course.teacher}<br>
                        <strong>Часов в неделю:</strong> ${course.week_length}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-success">${course.course_fee_per_hour} руб./час</span>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-2" 
                                    onclick="selectCourse(${course.id})">
                                Выбрать
                            </button>
                            <button class="btn btn-sm btn-primary" 
                                    onclick="enrollCourse(${course.id})">
                                Записаться
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Настройка поиска курсов
function setupCourseSearch() {
    const form = document.getElementById('course-search-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameSearch = document.getElementById('course-name-search').value.toLowerCase();
        const levelSearch = document.getElementById('course-level-search').value;
        
        filteredCourses = allCourses.filter(course => {
            const matchesName = !nameSearch || 
                course.name.toLowerCase().includes(nameSearch) ||
                course.description.toLowerCase().includes(nameSearch);
            
            const matchesLevel = !levelSearch || course.level === levelSearch;
            
            return matchesName && matchesLevel;
        });
        
        currentPage = 1;
        displayCourses(currentPage);
    });
}

// Создание пагинации
function createPagination(element, totalItems, currentPage, type) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    element.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Создаем элементы пагинации
    const createPageItem = (pageNum, text, isActive = false, isDisabled = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
        
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = 'javascript:void(0)';
        a.textContent = text;
        
        if (!isDisabled) {
            a.onclick = (e) => {
                e.preventDefault();
                if (type === 'courses') {
                    changePage(pageNum, type);
                }
            };
        }
        
        li.appendChild(a);
        return li;
    };
    
    // Кнопка "Назад"
    if (currentPage > 1) {
        element.appendChild(createPageItem(currentPage - 1, 'Назад'));
    } else {
        element.appendChild(createPageItem(1, 'Назад', false, true));
    }
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            element.appendChild(createPageItem(i, i.toString(), i === currentPage));
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            const span = document.createElement('span');
            span.className = 'page-link';
            span.textContent = '...';
            li.appendChild(span);
            element.appendChild(li);
        }
    }
    
    // Кнопка "Вперед"
    if (currentPage < totalPages) {
        element.appendChild(createPageItem(currentPage + 1, 'Вперед'));
    } else {
        element.appendChild(createPageItem(totalPages, 'Вперед', false, true));
    }
}

// Смена страницы
function changePage(page, type) {
    if (type === 'courses') {
        currentPage = page;
        displayCourses(currentPage);
        
        // Прокручиваем к заголовку "Предлагаемые курсы"
        document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
    }
}

// Обновление выбора курсов в форме заявки
function updateCourseSelect() {
    const select = document.getElementById('course-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите курс</option>';
    
    allCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} (${course.level})`;
        select.appendChild(option);
    });
}

// Отправка заявки на курс
async function submitCourseOrder() {
    try {
        const courseId = document.getElementById('course-select').value;
        const selectedDate = document.getElementById('course-start-date').value;
        const selectedTime = document.getElementById('course-start-time').value;
        const studentsNumber = parseInt(document.getElementById('course-students-number').value);
        
        // Проверка обязательных полей
        if (!courseId || !selectedCourse) {
            showNotification('Выберите курс', 'warning');
            return;
        }
        
        if (!selectedDate || !selectedTime) {
            showNotification('Выберите дату и время начала курса', 'warning');
            return;
        }
        
        if (!studentsNumber || studentsNumber < 1 || studentsNumber > 20) {
            showNotification('Пожалуйста, укажите корректное количество студентов (1-20)', 'warning');
            return;
        }
        
        // Общая продолжительность в часах
        const duration = selectedCourse.total_length * selectedCourse.week_length;
        
        // Проверка ранней регистрации (автоматически)
        const startDateObj = new Date(selectedDate);
        const today = new Date();
        const monthLater = new Date(today);
        monthLater.setMonth(today.getMonth() + 1);
        const isEarlyRegistration = startDateObj > monthLater;
        
        // Автоматические опции
        const isGroupEnrollment = studentsNumber >= 5;
        const isIntensiveCourse = selectedCourse.week_length >= 5;
        
        // Собираем данные заявки
        const orderData = {
            course_id: parseInt(courseId),
            tutor_id: 0,
            date_start: selectedDate,
            time_start: selectedTime,
            duration: duration,
            persons: studentsNumber,
            price: parseInt(document.getElementById('total-price').textContent.replace(/[^\d]/g, '')),
            early_registration: isEarlyRegistration,
            group_enrollment: isGroupEnrollment,
            intensive_course: isIntensiveCourse,
            supplementary: document.getElementById('supplementary')?.checked || false,
            personalized: document.getElementById('personalized')?.checked || false,
            excursions: document.getElementById('excursions')?.checked || false,
            assessment: document.getElementById('assessment')?.checked || false,
            interactive: document.getElementById('interactive')?.checked || false
        };
        
        // Отправляем запрос
        const response = await fetch(`${API_BASE_URL}/api/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при создании заявки');
        }
        
        const result = await response.json();
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('courseOrderModal'));
        modal.hide();
        
        // Показываем уведомление об успехе
        showNotification('Заявка на курс успешно создана!', 'success');
        
        // Сбрасываем форму
        document.getElementById('course-order-form').reset();
        hideFixedCourseBar();
        selectedCourse = null;
        
    } catch (error) {
        console.error('Ошибка при создании заявки:', error);
        showNotification(error.message || 'Ошибка при создании заявки', 'danger');
    }
}

// Отправка запроса на занятие с репетитором
async function submitTutorRequest() {
    try {
        if (!selectedTutor) {
            showNotification('Выберите репетитора', 'warning');
            return;
        }
        
        const studentName = document.getElementById('student-name').value;
        const studentEmail = document.getElementById('student-email').value;
        const tutorStartDate = document.getElementById('tutor-start-date').value;
        const tutorStartTime = document.getElementById('tutor-start-time').value;
        const tutorDuration = parseInt(document.getElementById('tutor-duration').value);
        
        // Проверка обязательных полей
        if (!studentName || !studentEmail) {
            showNotification('Заполните ваше имя и email', 'warning');
            return;
        }
        
        if (!tutorStartDate || !tutorStartTime) {
            showNotification('Выберите дату и время занятия', 'warning');
            return;
        }
        
        // Для репетитора всегда 1 студент
        const tutorStudentsNumber = 1;
        
        // Автоматические опции - групповых занятий с репетитором нет
        const isGroupEnrollment = false;
        
        // Собираем данные заявки
        const orderData = {
            course_id: 0,
            tutor_id: parseInt(selectedTutor.id),
            date_start: tutorStartDate,
            time_start: tutorStartTime,
            duration: tutorDuration,
            persons: tutorStudentsNumber, // Всегда 1
            price: parseInt(document.getElementById('tutor-total-price').textContent.replace(/[^\d]/g, '')),
            early_registration: false,
            group_enrollment: isGroupEnrollment,
            intensive_course: false,
            supplementary: false,
            personalized: false,
            excursions: false,
            assessment: false,
            interactive: false
        };
        
        // Отправляем запрос
        const response = await fetch(`${API_BASE_URL}/api/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка при создании заявки');
        }
        
        const result = await response.json();
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('tutorRequestModal'));
        modal.hide();
        
        // Показываем уведомление об успехе
        showNotification('Запрос на занятие с репетитором успешно отправлен!', 'success');
        
        // Сбрасываем форму
        document.getElementById('tutor-request-form').reset();
        selectedTutor = null;
        
        // Снимаем выделение со строки репетитора
        document.querySelectorAll('#tutors-table-body tr').forEach(row => {
            row.classList.remove('table-primary');
        });
        
        // Снимаем выделение с карточки репетитора
        document.querySelectorAll('.tutor-card').forEach(card => {
            card.classList.remove('selected-tutor');
        });
        
    } catch (error) {
        console.error('Ошибка при создании запроса:', error);
        showNotification(error.message || 'Ошибка при создании запроса', 'danger');
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
    // Отправка заявки на курс
    const submitCourseBtn = document.getElementById('submit-course-order');
    if (submitCourseBtn) {
        submitCourseBtn.addEventListener('click', submitCourseOrder);
    }
    
    // Отправка запроса на репетитора
    const submitTutorBtn = document.getElementById('submit-tutor-request');
    if (submitTutorBtn) {
        submitTutorBtn.addEventListener('click', submitTutorRequest);
    }
}