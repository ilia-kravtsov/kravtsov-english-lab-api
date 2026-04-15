# Kravtsov English Lab API

Backend часть платформы для изучения английского языка.
Реализована на основе NestJS с использованием PostgreSQL и JWT-аутентификации.

## Описание

API предоставляет функциональность для:

аутентификации пользователей (JWT + refresh)
управления наборами карточек (card sets)
работы с карточками (cards)
работы с лексическими единицами (lexical units)

Проект используется как backend для клиентского приложения (React + TypeScript) в рамках ВКР.

## Технологии

NestJS
TypeORM
PostgreSQL
JWT (access + refresh)
Cookie-based refresh tokens
Docker-ready (под деплой)

## Аутентификация

Реализована через JWT:

accessToken — в Authorization header
refreshToken — httpOnly cookie

Основные эндпоинты:

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password

## База данных

Используется PostgreSQL.

Конфигурация:

src/config/database.config.ts

Сущности:

User
CardSet
Card
LexicalUnit

## Инфраструктура

Nginx — reverse proxy
PM2 — управление процессом backend
PostgreSQL — база данных