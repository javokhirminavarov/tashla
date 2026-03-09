-- Add language preference to users
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'uz';

-- Add Russian translation columns to health_milestones
ALTER TABLE health_milestones ADD COLUMN title_ru TEXT;
ALTER TABLE health_milestones ADD COLUMN description_ru TEXT;

-- Sigaret milestones (Russian translations)
UPDATE health_milestones SET title_ru = 'Давление нормализуется', description_ru = 'Артериальное давление и пульс приходят в норму' WHERE habit_type = 'sigaret' AND hours_after = 0.33;
UPDATE health_milestones SET title_ru = 'Уровень кислорода восстанавливается', description_ru = 'Уровень кислорода в крови нормализуется' WHERE habit_type = 'sigaret' AND hours_after = 8;
UPDATE health_milestones SET title_ru = 'Риск инфаркта снижается', description_ru = 'Риск сердечного приступа начинает снижаться' WHERE habit_type = 'sigaret' AND hours_after = 24;
UPDATE health_milestones SET title_ru = 'Вкус и обоняние восстанавливаются', description_ru = 'Улучшается восприятие вкуса и запаха' WHERE habit_type = 'sigaret' AND hours_after = 48;
UPDATE health_milestones SET title_ru = 'Дыхание облегчается', description_ru = 'Дыхание облегчается, бронхи расслабляются' WHERE habit_type = 'sigaret' AND hours_after = 72;
UPDATE health_milestones SET title_ru = 'Кожа улучшается', description_ru = 'Улучшается цвет и эластичность кожи' WHERE habit_type = 'sigaret' AND hours_after = 720;
UPDATE health_milestones SET title_ru = 'Работа лёгких улучшается', description_ru = 'Функция лёгких улучшается до 30%' WHERE habit_type = 'sigaret' AND hours_after = 2160;
UPDATE health_milestones SET title_ru = 'Риск болезней сердца снижается', description_ru = 'Риск сердечных заболеваний снижается на 50%' WHERE habit_type = 'sigaret' AND hours_after = 8760;
UPDATE health_milestones SET title_ru = 'Риск инсульта устранён', description_ru = 'Риск инсульта сравнивается с некурящим человеком' WHERE habit_type = 'sigaret' AND hours_after = 43800;

-- Nos milestones (Russian translations)
UPDATE health_milestones SET title_ru = 'Полость рта восстанавливается', description_ru = 'Начинается восстановление слизистой рта' WHERE habit_type = 'nos' AND hours_after = 24;
UPDATE health_milestones SET title_ru = 'Раны заживают', description_ru = 'Раны и повреждения во рту начинают заживать' WHERE habit_type = 'nos' AND hours_after = 72;
UPDATE health_milestones SET title_ru = 'Дёсны восстанавливаются', description_ru = 'Воспаление дёсен заметно уменьшается' WHERE habit_type = 'nos' AND hours_after = 168;
UPDATE health_milestones SET title_ru = 'Полное восстановление рта', description_ru = 'Полость рта полностью восстанавливается' WHERE habit_type = 'nos' AND hours_after = 720;
UPDATE health_milestones SET title_ru = 'Риск рака снижается', description_ru = 'Риск рака полости рта начинает снижаться' WHERE habit_type = 'nos' AND hours_after = 2160;
UPDATE health_milestones SET title_ru = 'Пищеварение улучшается', description_ru = 'Улучшается состояние желудка и пищевода' WHERE habit_type = 'nos' AND hours_after = 8760;

-- Alkogol milestones (Russian translations)
UPDATE health_milestones SET title_ru = 'Сахар в крови нормализуется', description_ru = 'Уровень сахара в крови нормализуется' WHERE habit_type = 'alkogol' AND hours_after = 24;
UPDATE health_milestones SET title_ru = 'Детоксикация завершена', description_ru = 'Процесс детоксикации завершается' WHERE habit_type = 'alkogol' AND hours_after = 72;
UPDATE health_milestones SET title_ru = 'Сон улучшается', description_ru = 'Качество сна заметно улучшается' WHERE habit_type = 'alkogol' AND hours_after = 168;
UPDATE health_milestones SET title_ru = 'Печень восстанавливается', description_ru = 'Начинается уменьшение ожирения печени' WHERE habit_type = 'alkogol' AND hours_after = 720;
UPDATE health_milestones SET title_ru = 'Давление нормализуется', description_ru = 'Артериальное давление нормализуется' WHERE habit_type = 'alkogol' AND hours_after = 2160;
UPDATE health_milestones SET title_ru = 'Клетки печени восстанавливаются', description_ru = 'Клетки печени восстанавливаются' WHERE habit_type = 'alkogol' AND hours_after = 4380;
UPDATE health_milestones SET title_ru = 'Риск болезней печени снижается', description_ru = 'Риск заболеваний печени заметно снижается' WHERE habit_type = 'alkogol' AND hours_after = 8760;
