const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000; // Ты можешь заменить порт на нужный
const baseDir = path.join(__dirname, 'base');

// Middleware для обработки данных формы
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Путь для статических файлов (html страниц)
app.use(express.static(path.join(__dirname, 'public')));

// Функция для получения текущей даты и времени в формате дд.мм.гггг - чч:мм
const getCurrentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} - ${hours}:${minutes}`;
};

// Функция для чтения и записи данных в JSON
const readJSON = (fileName) => {
    const filePath = path.join(baseDir, fileName);
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    return [];
};

const writeJSON = (fileName, data) => {
    const filePath = path.join(baseDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Маршрут для получения всех заявок для km.html
app.get('/get-requests', (req, res) => {
    const { page } = req.query;
    const data = readJSON(`base ${page}.json`);
    res.json(data);
});

// Маршрут для изменения статуса заявки
app.post('/update-status', (req, res) => {
    const { page, id, status, response } = req.body;
    let data = readJSON(`base ${page}.json`);
    const index = data.findIndex(request => request.id === id);
    if (index !== -1) {
        data[index].status = status;
        data[index].response = response;
        data[index].timeUpdated = getCurrentDateTime(); // Обновляем с временем
        writeJSON(`base ${page}.json`, data);
        res.json({ message: 'Статус обновлен' });
    } else {
        res.status(404).json({ message: 'Заявка не найдена' });
    }
});

// Маршрут для отправки новых заявок
app.post('/submit-request', (req, res) => {
    const { name, phone, message, page } = req.body;
    const newRequest = {
        id: Date.now().toString(),
        name,
        phone,
        message,
        status: 'новое',
        timeReceived: getCurrentDateTime(), // Сохранение даты и времени получения
        timeUpdated: null,
        response: ''
    };
    let data = readJSON(`base ${page}.json`);
    data.push(newRequest);
    writeJSON(`base ${page}.json`, data);
    res.json({ message: 'Заявка отправлена' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

// Создание таблицы, если она не существует
db.run('CREATE TABLE IF NOT EXISTS entries (field1 TEXT, field2 TEXT)');
app.post('/submit-form', (req, res) => {
    const { field1, field2 } = req.body; // Получите данные из формы
    const stmt = db.prepare('INSERT INTO entries (field1, field2) VALUES (?, ?)');
    stmt.run(field1, field2, (err) => {
        if (err) {
            return res.status(500).send('Ошибка при сохранении данных');
        }
        res.send('Данные сохранены!');
    });
    stmt.finalize();
});

