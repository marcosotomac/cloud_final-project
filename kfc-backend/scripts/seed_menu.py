"""
Script para poblar el menú con productos de KFC
"""
import json
import requests

# API Configuration
API_URL = "https://f1n09qhtr6.execute-api.us-east-1.amazonaws.com"
TENANT_ID = "kfc-main"

# Productos de KFC con imágenes reales
PRODUCTS = [
    # Promos
    {
        "name": "Mega Delivery - 6 Piezas",
        "description": "6 Piezas de Pollo y 1 Papa Familiar",
        "price": 39.90,
        "oldPrice": 59.30,
        "discount": "-32%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-delivery-6-piezas-202506191742003730.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Wings & Krunch: 18 Hot Wings",
        "description": "18 Hot Wings y 1 Complemento Familiar",
        "price": 37.90,
        "oldPrice": 63.20,
        "discount": "-40%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/wings-krunch-18-hot-wings-202506161431538399.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Promo - 8 Piezas",
        "description": "8 Piezas de Pollo y 1 Papa Familiar",
        "price": 49.90,
        "oldPrice": 75.10,
        "discount": "-33%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-promo-8-piezas-202506161431542561.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Dúo Twister XL con Papas",
        "description": "2 Twisters XL Tradicionales y 2 Complementos Regulares",
        "price": 38.90,
        "oldPrice": 55.60,
        "discount": "-30%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/duo-twister-xl-con-papas-202506161431478822.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Promo: 10 Piezas",
        "description": "10 Piezas de Pollo, 1 Complemento Familiar y 1 Bebida 1.5 L",
        "price": 64.90,
        "oldPrice": 100.90,
        "discount": "-35%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-promo-10-piezas-202506191742036452.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Promo Personal: 2 Piezas",
        "description": "2 Piezas de Pollo, 3 Nuggets y 1 Complemento Regular",
        "price": 20.90,
        "oldPrice": 29.90,
        "discount": "-30%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/promo-personal-2-piezas-202506240338489475.jpg",
        "isAvailable": True,
        "stock": 50
    },
    {
        "name": "Krunchy Dúo",
        "description": "2 Krunchys y 1 Complemento Familiar",
        "price": 24.90,
        "oldPrice": 33.70,
        "discount": "-26%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/krunchy-duo-202506161431472213.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Combinados: Krunchy + Pieza de Pollo",
        "description": "1 Sandwich Krunchy, 1 Pieza de Pollo, 1 Complemento Regular y 1 Bebida Personal",
        "price": 22.90,
        "oldPrice": 28.60,
        "discount": "-19%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combinados-krunchy-pieza-de-pollo-202506241630599185.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Delivery + Gaseosa",
        "description": "6 Piezas de Pollo, 1 complemento familiar y 1 Bebida 1L",
        "price": 45.80,
        "oldPrice": 66.30,
        "discount": "-30%",
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-delivery-gaseosa-202506191741580903.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Krunchy Promo",
        "description": "1 Sandwich Krunchy (con filete de pierna crujiente) y 1 Complemento Regular",
        "price": 12.90,
        "oldPrice": None,
        "discount": None,
        "category": "Promos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/krunchy-promo-202511252009209615.jpg",
        "isAvailable": True,
        "stock": -1
    },
    # Megas
    {
        "name": "Mega Navidad",
        "description": "6 Piezas de Pollo, 6 Hot Wings o Nuggets, 1 Complemento Familiar y 1 Salsa Familiar",
        "price": 49.90,
        "oldPrice": 80.10,
        "discount": "-37%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-navidad-202511201432508045.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Mix: 8 Piezas",
        "description": "8 Piezas de Pollo, 6 Nuggets o Hot Wings, 1 Complemento Familiar y 1 Bebida 1.5L",
        "price": 69.90,
        "oldPrice": 103.00,
        "discount": "-32%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-mix-8-piezas-202506160431521944.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Super Mega: 10 Piezas",
        "description": "10 Piezas de Pollo, 8 Nuggets o Hot Wings o 1 PopCorn Chicken, 1 Complemento Familiar y 1 Bebida 1.5L",
        "price": 79.90,
        "oldPrice": 122.50,
        "discount": "-34%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/super-mega-10-piezas-202506160431531124.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega XL: 12 Piezas",
        "description": "12 Piezas de Pollo, 6 Nuggets o Hot Wings o 1 PopCorn Chicken, 1 Papa Super Familiar y 1 Bebida 1.5L",
        "price": 89.90,
        "oldPrice": 138.60,
        "discount": "-35%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-xl-12-piezas-202506160431492821.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Navidad con Gaseosas",
        "description": "6 Piezas de Pollo, 6 Hot Wings o Nuggets, 1 Complemento Familiar, 1 Bebida 1L y 1 Salsa Familiar",
        "price": 55.80,
        "oldPrice": 87.10,
        "discount": "-35%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-navidad-con-gaseosas-202511201432483370.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Clásico: 6 Piezas",
        "description": "6 Piezas de Pollo, 4 Nuggets o Hot Wings, 1 Complemento Familiar y 1 Ensalada o Puré Familiar",
        "price": 59.90,
        "oldPrice": 81.70,
        "discount": "-26%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-clasico-6-piezas-202506160431496210.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega 12 Piezas + Papas",
        "description": "12 Piezas de Pollo y 1 Papa Super familiar",
        "price": 77.90,
        "oldPrice": 110.70,
        "discount": "-29%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-12-piezas-papas-202506160431508736.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Gigante: 14 Piezas",
        "description": "14 Piezas de Pollo, 8 Nuggets o Hot Wings o 1 PopCorn Chicken, 1 Papa Super Familiar y 1 Bebida 1.5L",
        "price": 99.90,
        "oldPrice": 158.10,
        "discount": "-36%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-gigante-14-piezas-202507101450468122.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Supremo 16 Piezas",
        "description": "16 Piezas de Pollo, 8 Nuggets o Hot Wings o 1 PopCorn Chicken, 1 Papa Super Familiar y 1 Bebida 1.5L",
        "price": 109.90,
        "oldPrice": 173.90,
        "discount": "-36%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-supremo-16-piezas-202506160431523147.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega 10 Piezas con Papas",
        "description": "10 Piezas de Pollo y 1 Complemento Familiar",
        "price": 69.90,
        "oldPrice": 90.90,
        "discount": "-23%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-10-piezas-con-papas-202510280432307667.jpg",
        "isAvailable": True,
        "stock": -1
    },
    {
        "name": "Mega Extremo",
        "description": "18 Piezas de Pollo, 1 Papa Super Familiar, 1 Ensalada o Puré Familiar, 1 Salsa Familiar y 1 Bebida 1.5L",
        "price": 119.90,
        "oldPrice": 183.00,
        "discount": "-34%",
        "category": "Megas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mega-extremo-202508021628440899.jpg",
        "isAvailable": True,
        "stock": -1
    },
    # Para 2
    {
        "name": "Combo Chick'N Share 18 Nuggets",
        "description": "18 Nuggets, 2 complementos regulares y 1 Gaseosa 1L",
        "price": 43.90,
        "oldPrice": 67.40,
        "discount": "-34%",
        "category": "Para 2",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-chick-n-share-18-nuggets-202507251623300783.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Chick'N Share 3 Piezas + Snacks",
        "description": "3 Piezas de Pollo, 6 Nuggets o Hot Wings y 2 complementos regulares",
        "price": 37.90,
        "oldPrice": 51.60,
        "discount": "-26%",
        "category": "Para 2",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/chick-n-share-3-piezas-snacks-202506161431517860.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Popcorn para 2",
        "description": "2 PopCorn Chicken y 2 Complementos Regulares",
        "price": 32.90,
        "oldPrice": 43.60,
        "discount": "-24%",
        "category": "Para 2",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/popcorn-para-2-202507101450460538.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Chick'N Share 5 Piezas + 2 Papas",
        "description": "5 Piezas de Pollo y 2 Papas Personales",
        "price": 37.90,
        "oldPrice": 51.30,
        "discount": "-26%",
        "category": "Para 2",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/chick-n-share-5-piezas-2-papas-202507251623238925.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Chick'N Share Tenders",
        "description": "8 Tenders (100% Pechuga de Pollo), 2 Complementos Regulares y 2 Salsas Personales",
        "price": 42.90,
        "oldPrice": 56.30,
        "discount": "-23%",
        "category": "Para 2",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/chick-n-share-tenders-202511131432248214.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Chick'N Share Navidad",
        "description": "8 Nuggets, 8 Hot Wings, 2 Complementos Regulares y 1 Bebida 1L",
        "price": 39.90,
        "oldPrice": 63.20,
        "discount": "-36%",
        "category": "Para 2",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/chick-n-share-navidad-202511201432501471.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Chick'N Share 18 Hot Wings + Papas",
        "description": "18 Hot Wings y 2 complementos regulares",
        "price": 42.90,
        "oldPrice": 63.10,
        "discount": "-32%",
        "category": "Para 2",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/chick-n-share-18-hot-wings-papas-202506161431432315.jpg",
        "stock": -1,
        "isAvailable": True
    },
    # Sándwiches & Twister XL
    {
        "name": "Combo Twister XL Tradicional",
        "description": "1 Twister XL Tradicional, 1 Complemento Regular y 1 Bebida Personal",
        "price": 27.90,
        "oldPrice": 32.70,
        "discount": "-14%",
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-twister-xl-tradicional-202506160431460844.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Twister XL Tradicional",
        "description": "Tortilla de maíz, 2 tenders 100% pechuga de pollo, lechuga, tomate, queso americano y mayonesa",
        "price": 21.90,
        "oldPrice": None,
        "discount": None,
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/twister-xl-tradicional-202506160431473659.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Combo Twister XL Americano",
        "description": "1 Twister XL Americano, 1 Complemento Regular y 1 Bebida Personal",
        "price": 28.90,
        "oldPrice": 33.70,
        "discount": "-14%",
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-twister-xl-americano-202506160431500330.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Twister XL Americano",
        "description": "Tortilla de maíz, 2 tenders 100% pechuga de pollo, lechuga, tocino, queso americano y salsa meltz",
        "price": 22.90,
        "oldPrice": None,
        "discount": None,
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/twister-xl-americano-202506160431475691.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Combo Twister XL Peruano",
        "description": "1 Twister XL Peruano, 1 Complemento Regular y 1 Bebida Personal",
        "price": 27.90,
        "oldPrice": 30.70,
        "discount": "-9%",
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-twister-xl-peruano-202510070432507877.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Big Box Sandwich Deluxe",
        "description": "1 Kentucky Chicken Sándwich Deluxe, 3 Nuggets o Hot Wings, 1 Complemento Regular, 1 Ensalada Regular y 1 Bebida Personal",
        "price": 32.90,
        "oldPrice": 46.15,
        "discount": "-28%",
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/big-box-sandwich-deluxe-202506160431485912.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Sandwich Deluxe",
        "description": "Sandwich de pan brioche, pechuga crujiente con triple empanizado, queso americano, salsa meltz, lechuga y tocino.",
        "price": 20.90,
        "oldPrice": None,
        "discount": None,
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/kentucky-chicken-sandwich-deluxe-202506160431506730.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Combo Sandwich Deluxe",
        "description": "1 Kentucky Chicken Sándwich Deluxe, 1 Complemento Regular y 1 Bebida Personal",
        "price": 27.90,
        "oldPrice": 31.70,
        "discount": "-11%",
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-sandwich-deluxe-202506160431525378.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Combo Sandwich Original",
        "description": "1 Kentucky Chicken Sánguich, 1 Complemento Regular y 1 Bebida Personal",
        "price": 25.90,
        "oldPrice": 29.70,
        "discount": "-12%",
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-sandwich-original-202506160431516393.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Kentucky Chicken Sandwich Original",
        "description": "Sandwich de pan brioche con mantequilla, pechuga de pollo crujiente con triple empanizado, mayonesa premium y pepinillos",
        "price": 18.90,
        "oldPrice": None,
        "discount": None,
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/kentucky-chicken-sandwich-original-202506160431450842.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Twister XL Peruano",
        "description": "1 Twister XL Peruano con Ají de la Casa y Crujientes Papitas al hilo",
        "price": 21.90,
        "oldPrice": None,
        "discount": None,
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/twister-xl-peruano-202510070432504728.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Big Box Twister XL Americano",
        "description": "1 Twister XL Americano, 3 Nuggets o Hot Wings, 1 Complemento Regular, 1 Ensalada o Puré Regular y 1 Bebida Personal",
        "price": 33.90,
        "oldPrice": 48.15,
        "discount": "-29%",
        "category": "Sándwiches & Twister XL",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/big-box-twister-xl-americano-202511251450274618.jpg",
        "stock": -1,
        "isAvailable": True
    },
    # Big Box
    {
        "name": "Big Box Navidad",
        "description": "3 Piezas de Pollo, 4 Nuggets, 1 Complemento Regular, 1 Ensalada o Puré Regular y 1 Bebida Personal",
        "price": 29.90,
        "oldPrice": 49.40,
        "discount": "-39%",
        "category": "Big Box",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/big-box-navidad-202511201432530944.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Big Box Wow",
        "description": "2 Piezas de Pollo, 3 Nuggets o Hot Wings, 1 Complemento Regular, 1 Ensalada Regular, 1 Bebida Personal",
        "price": 28.90,
        "oldPrice": 41.15,
        "discount": "-29%",
        "category": "Big Box",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/big-box-wow-202506160431505385.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Big Box Classic",
        "description": "3 Piezas de Pollo, 1 Papa Personal, 1 Ensalada Regular, 1 Bebida Personal",
        "price": 27.90,
        "oldPrice": None,
        "discount": None,
        "category": "Big Box",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/big-box-classic-202510221536466605.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Big Box Tenders",
        "description": "4 Tenders (100% Pechuga de Pollo), 1 Complemento Regular, 1 Ensalada o Puré Regular, 1 Salsa Personal y 1 Bebida Personal",
        "price": 32.90,
        "oldPrice": 51.40,
        "discount": "-35%",
        "category": "Big Box",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/big-box-tenders-202507190432023360.jpg",
        "stock": -1,
        "isAvailable": True
    },
    # Combos
    {
        "name": "Combo 8 Hot Wings",
        "description": "8 Hot Wings, 1 Complemento Regular y 1 Bebida Personal",
        "price": 24.90,
        "oldPrice": 33.60,
        "discount": "-25%",
        "category": "Combos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-8-hot-wings-202506160431470733.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Combo 8 Nuggets",
        "description": "8 Nuggets, 1 Complemento Regular y 1 Bebida Personal",
        "price": 24.90,
        "oldPrice": 32.40,
        "discount": "-23%",
        "category": "Combos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-8-nuggets-202506160431467787.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Combo Clásico: 2 Piezas",
        "description": "2 Piezas de Pollo , 1 Complemento Regular, 1 Bebida Personal",
        "price": 21.90,
        "oldPrice": 26.70,
        "discount": "-17%",
        "category": "Combos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-clasico-2-piezas-202506160431464846.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Combo Tenders",
        "description": "3 Tenders, 1 Complemento Regular, 1 Salsa Personal y 1 Bebida Personal",
        "price": 25.90,
        "oldPrice": 30.20,
        "discount": "-14%",
        "category": "Combos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/combo-tenders-202507030432107022.jpg",
        "stock": -1,
        "isAvailable": True
    },
    # Complementos
    {
        "name": "Papa Familiar",
        "description": "Tradicionales papas fritas (240 gr. aprox.)",
        "price": 11.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/papa-familiar-202506160431489482.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Ensalada Regular",
        "description": "Nuestra tradicional ensalada de col con zanahoria y aderezo agridulce (4 Oz. aprox.)",
        "price": 5.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/ensalada-regular-202506160431520430.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "6 Hot Wings",
        "description": "6 deliciosas alitas de pollo picante",
        "price": 17.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/paquete-6-hot-wings-202506160431514443.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Ensalada Familiar",
        "description": "Nuestra tradicional ensalada de col con zanahoria y aderezo agridulce (16 Oz. aprox.)",
        "price": 11.00,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/ensalada-familiar-202506160431528586.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "BBQ Familiar",
        "description": "Salsa Barbecue",
        "price": 3.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/bbq-familiar-202507101450439782.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "PopCorn Chicken",
        "description": "1 PopCorn Chicken",
        "price": 15.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/popcorn-chicken-202506160431510539.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Papa Super Familiar",
        "description": "Tradicionales papas fritas 450 gr.",
        "price": 15.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/papa-super-familiar-202506160431519379.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Papa Personal",
        "description": "Tradicionales papas fritas.",
        "price": 6.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/papa-personal-202506160431453677.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "6 Nuggets",
        "description": "6 Deliciosos Nuggets de Pollo 100% pechuga empanizados en receta secreta",
        "price": 16.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/paquete-6-nuggets-202506160431425197.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "6 Snacks Salseo",
        "description": "6 Hot Wings o Nuggets bañados en BBQ o Miel Picante",
        "price": 19.90,
        "oldPrice": 22.20,
        "discount": "-10%",
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/6-snacks-banados-202509181626251668.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "12 Snacks Salseo",
        "description": "12 Hot Wings o Nuggets bañados en BBQ o Miel Picante",
        "price": 29.90,
        "oldPrice": 44.40,
        "discount": "-32%",
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/12-snacks-banados-202509181626223690.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Puré Familiar",
        "description": "Nuestro tradicional puré de papas con salsa gravy en presentación familiar",
        "price": 11.00,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/pure-familiar-202506201432024958.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Puré Regular",
        "description": "Nuestro tradicional puré de papas con salsa gravy en presentación personal",
        "price": 5.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/pure-regular-202506201432027532.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "18 Snacks Salseo",
        "description": "18 Hot Wings o Nuggets bañados en BBQ o Miel Picante",
        "price": 39.90,
        "oldPrice": 66.60,
        "discount": "-40%",
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/18-snacks-banados-202509181626254626.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Paquete 6 Tenders",
        "description": "6 crujientes tenders elaborados con 100% pechuga de pollo",
        "price": 32.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/paquete-6-tenders-202506160431484069.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Paquete 3 Tenders",
        "description": "3 crujientes tenders elaborados con 100% pechuga de pollo",
        "price": 17.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/paquete-3-tenders-202506160431518162.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Piezas de Pollo (2 un)",
        "description": "2 Piezas de pollo en receta Original o Crispy",
        "price": 15.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/piezas-de-pollo-2-un-202507241849077797.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Paquete 9 Tenders",
        "description": "9 crujientes tenders elaborados con 100% pechuga de pollo",
        "price": 45.90,
        "oldPrice": None,
        "discount": None,
        "category": "Complementos",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/paquete-9-tenders-202506160431428801.jpg",
        "stock": -1,
        "isAvailable": True
    },
    # Postres
    {
        "name": "Pie de Manzana",
        "description": "Delicioso y crocante pie relleno de trozos de manzana caramelizada",
        "price": 6.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/pie-de-manzana-202505160431521970.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "2X1 Pie Dulce de Leche",
        "description": "2 Deliciosos y crocantes pie rellenos de Dulce de Leche",
        "price": 5.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/2x1-pie-dulce-de-leche-202511120432401430.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Mousse de Lúcuma",
        "description": "Mousse de Lúcuma Personal",
        "price": 5.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/mousse-de-lucuma-202506161431528220.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Torta Trufada",
        "description": "Torta sabor chocolate con crema de avellanas",
        "price": 10.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/torta-trufada-202507101450437961.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Tres Leches de Vainilla",
        "description": "Tres Leches de Vainilla Personal",
        "price": 5.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/tres-leches-de-vainilla-202506161431503208.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Tres Leches de Chocolate",
        "description": "Tres Leches de Chocolate Personal",
        "price": 5.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/tres-leches-de-chocolate-202506161431469054.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "3 Pie dulce de leche",
        "description": "3 Pie dulce de leche",
        "price": 14.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/pie-de-dulce-de-leche-3-un-202510091544116975.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Galleta de Avena",
        "description": "Galleta de Avena",
        "price": 4.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/galleta-de-avena-202506191651323148.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Pie de Dulce de Leche",
        "description": "Delicioso y crocante pie relleno de Dulce de Leche",
        "price": 6.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/pie-de-dulce-de-leche-202509051432123079.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Pie de Dulce de Leche (Oferta)",
        "description": "Delicioso y crocante pie relleno de Dulce de Leche",
        "price": 3.90,
        "oldPrice": None,
        "discount": None,
        "category": "Postres",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/pie-de-dulce-de-leche-202511120432449620.jpg",
        "stock": -1,
        "isAvailable": True
    },
    # Bebidas
    {
        "name": "Fanta 500 ml",
        "description": "1 Fanta Personal",
        "price": 4.90,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/fanta-500-ml-202506191651303714.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Inca Kola Sin Azúcar 500 ml",
        "description": "1 Inca Cola sin azúcar Personal",
        "price": 4.90,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/inca-kola-sin-azucar-500-ml-202506191651281710.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Inca Kola Sin Azúcar 1L",
        "description": "Inca Kola Sin Azúcar 1L",
        "price": 7.00,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/inca-kola-sin-azucar-1l-202506191651302245.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Coca-Cola Zero Azúcar 500 ml",
        "description": "1 Coca Cola sin azúcar Personal",
        "price": 4.90,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/coca-cola-sin-azucar-500-ml-202506191651322053.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Sprite 500 ml",
        "description": "1 Sprite Personal",
        "price": 4.90,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/sprite-500-ml-202506191651292072.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Inca Kola Sin Azúcar 1.5L",
        "description": "Inca Kola Sin Azúcar 1.5L",
        "price": 10.00,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/inca-kola-sin-azucar-1-5l-202506191651321056.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Coca-Cola Sin Azúcar 1L",
        "description": "Coca-Cola Sin Azúcar 1L",
        "price": 7.00,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/coca-cola-sin-azucar-1l-202506191651291492.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Coca-Cola Sin Azúcar 1.5L",
        "description": "Coca-Cola Sin Azúcar 1.5L",
        "price": 10.00,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/coca-cola-sin-azucar-1-5l-202506191651302678.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Fanta 2.25L",
        "description": "1 Fanta de 2.25L",
        "price": 13.00,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/fanta-2-25l-202506180431581336.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Sprite 2.25L",
        "description": "1 Sprite de 2.25L",
        "price": 13.00,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/sprite-2-25l-202506190431585987.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Agua Saborizada de Manzana",
        "description": "Agua Saborizada de Manzana",
        "price": 4.50,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/agua-saborizada-de-manzana-202508202217312071.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Agua San Luis Sin Gas 750 ml",
        "description": "Agua San Luis Sin Gas 750 ml",
        "price": 4.50,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/agua-san-luis-sin-gas-625-ml-202506191651292891.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Agua San Luis Con Gas 625 ml",
        "description": "Agua San Luis Con Gas 625 ml",
        "price": 4.50,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/agua-san-luis-con-gas-625-ml-202506191651293551.jpg",
        "stock": -1,
        "isAvailable": True
    },
    {
        "name": "Agua Saborizada de Maracuyá",
        "description": "Agua Saborizada de Maracuyá",
        "price": 4.50,
        "oldPrice": None,
        "discount": None,
        "category": "Bebidas",
        "imageUrl": "https://delosi-pidelo.s3.amazonaws.com/kfc/products/agua-saborizada-de-maracuya-202508202217313953.jpg",
        "stock": -1,
        "isAvailable": True
    },
]


def create_product(product):
    """Create a single product via API"""
    url = f"{API_URL}/tenants/{TENANT_ID}/menu"

    # Clean None values for the API
    clean_product = {k: v for k, v in product.items() if v is not None}

    try:
        response = requests.post(url, json=clean_product)
        if response.status_code in [200, 201]:
            print(f"✅ Creado: {product['name']}")
            return True
        else:
            print(
                f"❌ Error al crear {product['name']}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("🍗 Poblando menú de KFC...")
    print(f"API: {API_URL}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Total productos: {len(PRODUCTS)}")
    print("-" * 50)

    success = 0
    failed = 0

    for product in PRODUCTS:
        if create_product(product):
            success += 1
        else:
            failed += 1

    print("-" * 50)
    print(f"✅ Productos creados: {success}")
    print(f"❌ Errores: {failed}")
    print("🎉 ¡Listo!")


if __name__ == "__main__":
    main()
