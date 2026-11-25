from datetime import datetime, timezone
from decimal import Decimal

from app import create_app
from extensions import db
from models import UndergroundProduct, User
from underground.schemas import underground_product_schema

DEMO_PRODUCTS = (
    {
        "seed_key": "alt-fashion-satin-twist-mini-dress",
        "name": "Forever 21 Satin Twist-Front Strapless Mini Dress",
        "description": "Adult women's mini dress. Approximate reference price in KES; retailer stock and checkout are not connected.",
        "price": "1300",
        "category": "Alternative Fashion",
        "subcategory": "Mini Dresses",
        "image": "https://www.forever21.com/cdn/shop/files/01371120-01-2_front.png?v=1771970833&width=1024",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-pink-strapless-mini-dress",
        "name": "Forever 21 Pink Strapless Mini Dress",
        "description": "Adult women's short strapless dress. Catalog reference price is approximate; retailer stock and checkout are not connected.",
        "price": "4680",
        "category": "Alternative Fashion",
        "subcategory": "Mini Dresses",
        "image": "https://www.forever21.com/cdn/shop/files/01409726-04-1_styledfront_1.jpg?v=1784668401&width=1000",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-gia-red-satin-mini-dress",
        "name": "Gia Red Satin Strapless Mini Dress",
        "description": "Adult women's satin mini dress. Approximate reference price in KES; retailer stock and checkout are not connected.",
        "price": "10270",
        "category": "Alternative Fashion",
        "subcategory": "Mini Dresses",
        "image": "https://bohopink.com/cdn/shop/files/gia-red-satin-strapless-mini-dress.jpg?v=1762465234&width=960",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-vs-bandeau-bra",
        "name": "Victoria's Secret Push-Up Wireless Bandeau Strapless Bra",
        "description": "Plain product-only photo, no model. Approximate reference price in KES; store stock and checkout are not connected.",
        "price": "7794",
        "category": "Alternative Fashion",
        "subcategory": "Underwear",
        "image": "https://images-static.nykaa.com/media/catalog/product/a/c/acb6d141123744054A2_3.jpg",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-vs-cotton-thong",
        "name": "Victoria's Secret Logo Cotton Thong Panty",
        "description": "Plain product-only photo, no model. Approximate reference price in KES; store stock and checkout are not connected.",
        "price": "1625",
        "category": "Alternative Fashion",
        "subcategory": "Underwear",
        "image": "https://www.victoriassecret.com.au/dw/image/v2/BLPL_PRD/on/demandware.static/-/Sites-vs-master-catalog/default/dwa6294376/large/1124446274FO_OF_F.jpg?sh=1500&sm=fit&sw=1500",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-vs-seamless-panties",
        "name": "Victoria's Secret Seamless Panties",
        "description": "Product-only assortment photo, no models. Approximate reference price in KES; store stock and checkout are not connected.",
        "price": "1625",
        "category": "Alternative Fashion",
        "subcategory": "Underwear",
        "image": "https://i.ebayimg.com/images/g/Cm0AAeSwfHNor1at/s-l1200.jpg",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-kilimall-black-two-piece-bikini",
        "name": "Women’s Black Halter Two-Piece Bikini Set",
        "description": "Two-piece swimsuit from a Kilimall Kenya listing. Listed price shown in KES; confirm current stock and purchase details directly with the seller.",
        "price": "600",
        "category": "Alternative Fashion",
        "subcategory": "Two-Piece Swimwear",
        "image": "https://img.kilimall.com/c/obs/seller/9892/goods_image/240723143404_6e6126373b1da71c8aa988f1eddd9554.jpg",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-shein-black-two-piece-bikini",
        "name": "Halter Neck Side-Tie Two-Piece Bikini",
        "description": "Two-piece swimwear listing. Approximate reference price in KES; retailer stock and checkout are not connected.",
        "price": "980",
        "category": "Alternative Fashion",
        "subcategory": "Two-Piece Swimwear",
        "image": "https://img.ltwebstatic.com/images3_pi/2023/10/30/ce/1698630142b422cdc40ee48083825da975a258e684_thumbnail_600x.jpg",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-forever21-hello-kitty-cellphone-bag",
        "name": "Forever 21 Hello Kitty Cellphone Bag",
        "description": "Crochet crossbody phone purse. Approximate reference price in KES; retailer stock and checkout are not connected.",
        "price": "1037",
        "category": "Alternative Fashion",
        "subcategory": "Purses",
        "image": "https://www.forever21.com/cdn/shop/files/Large-01287578-01-1_front.jpg?v=1751586585&width=1000",
        "availability": True,
    },
    {
        "seed_key": "alt-fashion-forever21-hello-kitty-water-bottle-sling",
        "name": "Forever 21 Hello Kitty Water Bottle Sling Bag",
        "description": "Small crossbody sling bag. Approximate reference price in KES; retailer stock and checkout are not connected.",
        "price": "647",
        "category": "Alternative Fashion",
        "subcategory": "Purses",
        "image": "https://www.forever21.com/cdn/shop/files/Large-01275241-01-1_front.jpg?crop=center&height=1200&v=1751585518&width=1200",
        "availability": True,
    },
    {
        "seed_key": "energy-monster-original-green",
        "name": "Monster Energy Original Green",
        "description": "Monster Energy Original Green (OG). Approximate KES reference price; retail stock is not connected.",
        "price": "389",
        "category": "Energy Drinks",
        "subcategory": "Monster Energy",
        "image": "https://web-assests.monsterenergy.com/mnst/be642d6a-2c3c-4978-a985-56ef9df7eae1.png",
        "availability": True,
    },
    {
        "seed_key": "energy-ghost-og",
        "name": "GHOST Energy OG",
        "description": "GHOST Energy OG. Approximate KES reference price; retail stock is not connected.",
        "price": "389",
        "category": "Energy Drinks",
        "subcategory": "GHOST Energy",
        "image": "https://drinkghost.com/cdn/shop/files/OGRight_9721ee23-546f-4786-ad3e-93003161de6a_200x.webp?v=1756221881",
        "availability": True,
    },
    {
        "seed_key": "nightlife-dubai-table-request-sample",
        "name": "Dubai, 8 PM — Table Request for 5",
        "description": "KES 15,000 per person estimate. Example request only; no venue reservation or live availability is attached. Confirm the price and booking directly with a venue.",
        "price": "15000",
        "category": "Nightlife & Entertainment",
        "subcategory": "Booking Example",
        "image": "https://www.timeoutdubai.com/cloud/timeoutdubai/2023/02/15/STAY-by-Yannick-Alleno-Dining-Room-1024x768.jpg",
        "availability": True,
    },
    {
        "seed_key": "motorsports-dubai-autodrome-info",
        "name": "Dubai Autodrome — Track Location",
        "description": "Venue directory card for Dubai Autodrome in Motor City, Dubai. This is not a ticket or booking; check the official venue for current activities and availability.",
        "price": "8500",
        "category": "Motorsports",
        "subcategory": "Race Track Locations",
        "image": "https://www.musco.com/wp-content/uploads/2024/04/autodrome_2.jpg",
        "availability": True,
    },
    {
        "seed_key": "motorsports-yas-marina-circuit-info",
        "name": "Yas Marina Circuit — Track Location",
        "description": "Venue directory card for Yas Marina Circuit on Yas Island, Abu Dhabi. This is not a ticket or booking; check the official venue for current activities and availability.",
        "price": "12000",
        "category": "Motorsports",
        "subcategory": "Race Track Locations",
        "image": "https://cdn.getyourguide.com/img/location/560518b280a83.jpeg/99.jpg",
        "availability": True,
    },
)


# These generated catalog entries are illustrative price and location references.
# They are not connected to venue booking, track schedules, or live availability.
_NIGHTLIFE_IMAGES = (
    "https://qbeuqgtblostqyuvaxbg.supabase.co/storage/v1/object/public/images/nairobi-feast/restaurants/talisman.jpg",
    "https://www.bestrooftop.com/storage/public/restaurants/8066-kilele-nyama/profile/gallery/ibis-kilele-nyama-20.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/cc/13/65/the-carnivore-restaurant.jpg?h=1200&s=1&w=1200",
    "https://tamarind.co.ke/_next/image?q=75&url=https%3A%2F%2Fs3.tamarind.michaelgift.cloud%2Flive%2Flocations%2Ftamarind-mombasa%2Fcarousel%2F03.jpeg&w=3840",
    "https://keniareisen.de/wp-content/uploads/2020/11/the-sands-at-nomad-restaurant-aussen.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/7a/99/8f/dining-with-a-view-of.jpg?h=1800&s=1&w=2400",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0a/86/d9/4d/hermosa-chica-restaurant.jpg?h=-1&s=1&w=600",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/63/e5/1f/taidy-s-suites-nakuru.jpg?h=-1&s=1&w=700",
    "https://nexara-dubai.com/blog-images/dubai-luxury-restaurant-panoramic-city-view.webp",
    "https://do84cgvgcm805.cloudfront.net/article/655/1200/427520f7ea5a43c9ff6f475fd821edfb6848b14279ca395061c3b43f72440b51.jpg",
    "https://visitabudhabi.ae/-/media/project/vad/where-to-go/dining/dining-1/nahaam/auhetci---nahaam-restaurant---indoor-seating-area.jpg?rev=38e42983566449618041e1a5e22af07a",
    "https://cache.marriott.com/content/dam/marriott-renditions/DOHWH/dohwh-spice-market-0385-hor-clsc.jpg?downsize=1720px%3A%2A&interpolation=progressive-bilinear&output-quality=70",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/7a/fa/ba/caption.jpg?h=-1&s=1&w=1100",
    "https://cache.marriott.com/content/dam/marriott-renditions/EBBNS/ebbns-restaurant-5289-sq.jpg",
    "https://www.thaikani.com/assets/Thai%20Kani%20patio_1761126760288-C7X-cYMP.webp",
    "https://womanadvice.ru/sites/default/files/22/restoran_otelya_the_residence_zanzibar.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2a/cb/0b/07/caption.jpg?h=1200&s=1&w=1200",
    "https://media.dineazi.com/restaurant-media/235/1774516281408-3bf25580-33ed-4c68-ad09-3e76188c7ff1.jpg",
    "https://pub-5bcc3edf34304d04b59dc91e1ad9d2fd.r2.dev/tortoisepath.com/uploads/2024/01/03161015/Club-Smooth-Accra-Ghana-TortoisePathcom-4-jpeg.webp",
    "https://cdn.mahlatini.com/The-Nines-Restaurant-Cape-Town.jpg",
    "https://www.wantedonline.co.za/resizer/v2/HRGUDOXCUNPU5MGRAAFISQOSKM.jpg?auth=640101aa7c7c2d70ee9ca579bf82442f90df7999233994b8a9b13c89f0ba7c9e&height=1024&smart=true&width=1536",
    "https://aquadrom-yuls.com/img/slides/restaurant.jpg",
    "https://qbeuqgtblostqyuvaxbg.supabase.co/storage/v1/object/public/images/nairobi-feast/restaurants/carnivore-interior.jpg",
    "https://cdn.prod.website-files.com/66db00fc66a77b1567526e7f/6711ae5055e2f69834ac061d_stay-dubai-restaurant2.webp",
    "https://media.cntraveler.com/photos/5dc1d41b51e5fc00088a0d56/master/w_1024%2Cc_limit/coya-abudhabi-2019-5.jpeg",
    "https://c.regencyholidays.com/blog/blog/content/images/2022/05/Spice-Market.webp",
    "https://www.thehuthotelrwanda.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-03-at-09.39.51-2.jpeg",
    "https://images.squarespace-cdn.com/content/v1/6789dd7ed9d1e51b968f9d15/d7e404ff-facc-42dc-bb16-b6e12673719e/be43fb8c4c1d0f3be8d0e561003a7d4e3f38db04-2048x1365.jpg",
    "https://www.utopiacapetown.co.za/wp-content/uploads/2019/04/Utopia_Restautant_15-683x1024.jpg",
    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/aa/25/b4/agness-zanzibar.jpg?h=-1&s=1&w=1200",
)
# Circuit-specific photographs. Keep this aligned with _RACE_TRACKS so each
# location card shows its named venue rather than cycling through unrelated tracks.
_RACE_TRACK_IMAGES = (
    "https://images.motorsport-magazin.com/images/1200/1200/0740991.jpg",
    "https://sportsbase.io/images/gpfans/copy_1200x800/54acde6e7b97c62310038ce5e4f27070ca189ac3.jpg",
    "https://cdn-9.motorsport.com/images/amp/27vkBEx0/s6/qatar-track.jpg",
    "https://rioandlearn.com/wp-content/uploads/2025/10/1024px-Autodromo_Jose_Carlos_Pace_July_3_2018_SkySat-rotated.jpg",
    "https://assets.simpleviewinc.com/simpleview/image/fetch/c_fill%2Ch_650%2Cq_75%2Cw_972/https%3A/assets.simpleviewinc.com/simpleview/image/upload/v1/clients/austin/Picture1_099cff6b-b10a-495e-a5ae-564bddd6c0dc.png",
    "https://www.f1-world.ru/tracks/shanghai_bird_2018.jpg",
    "https://cdn.guerinsportivo.it/images/2024/07/19/084017775-fb678899-494f-445d-a8fb-62ad22f729e5.jpg",
    "https://www.parcomonza.org/compleanno20/images/compleanno_20/pianta-del-parco-con-autodromo.jpg",
    "https://www.racecracks.nl/content/uploads/2024/07/Circuit-Spa-Francorchamps.jpg",
    "https://s2-ge.glbimg.com/y86Vn34-e-qpj4IGO-giBU2fxw4%3D/0x0%3A2048x1186/924x0/smart/filters%3Agifv%28%29%3Astrip_icc%28%29/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2021/A/r/m6JbW0TxKZZxnK7jUBlQ/merlin-157516356-009c6be7-3977-4ad6-b4bc-52d2addf96e1-superjumbo.jpg",
    "https://www.restec.or.jp/knowledge/earthgallery/lchovr00000006rk-img/suzukacircuit.jpg",
    "https://media.formula1.com/image/upload/c_lfill%2Cw_3392/q_auto/v1740000001/GettyImages-1400070710.webp",
    "https://static.independent.co.uk/2024/09/19/09/GettyImages-1175935329.jpg?fit=crop&height=900&width=1200",
    "https://media.formula1.com/image/upload/c_lfill%2Cw_3392/q_auto/v1740000001/albert-park-aerial.webp",
    "https://media.formula1.com/image/upload/content/dam/fom-website/manual/Misc/2022manual/2022Races/CanadaGP/Pre-race/SD-2017-Canada-Saturday-047_1727421.JPG",
    "https://duncanwebmin.notiauto.com/repository/sitios/innerpicstmp/tinyimg1720635614213618406.jpg?nc=1720635616",
    "https://pbs.twimg.com/media/GppFdNBXgAAhiGC?format=jpg&name=large",
    "https://s.yimg.com/ny/api/res/1.2/f3Y7ydzy5Vzlo2xL_2uKnA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTY0MDtjZj13ZWJw/https%3A/media.zenfs.com/en/f1_chronicle_874/8dc8d8f8ebb14c416ecfa355cca7acc3",
    "https://media.formula1.com/image/upload/c_lfill%2Cw_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2021manual/2021DutchGPManuals/Thursday/Zandvoort-aerial.webp",
    "https://motorsports.jaf.or.jp/-/media/1/3375/3381/oZC2Gc2T5ngv.jpg?hash=05A258C88D6E16AC3AA0FC2AB9F279F8&mw=1200&rev=d5168704070c4d50bbeafa91822e59e6",
    "https://media.formula1.com/image/upload/t_16by9Centre/c_lfill%2Cw_2048/q_auto/v1740000001/fom-website/2026/Miscellaneous/SD-2017-Malaysia-Saturday-154_1981744%20169.webp",
    "https://api.lemans.org/media/cache/api_news_large/assets/fileuploads/59/df/59df6e1570855.jpg",
    "https://www.tour-edition.de/media/images/country/146/xl_USA_Florida_Daytona%20Speedway_iS_000019041085_Full_ie.jpg",
    "https://cdn.indebergen.nl/media/ogtfdkkz/162-n%C3%BCrburgring.jpg?anchor=center&format=webp&height=870&mode=crop&quality=80&width=1160",
    "https://storage.ghost.io/c/dd/af/ddafbd99-2ccd-468c-b622-4b3cccf80b49/content/images/2025/06/Kyalami-Grand-Prix-Circuit-1.jpg",
    "https://www.roadracingworld.com/wp-content/uploads/2024/10/IMG_9594_1729224107.jpg",
    "https://www.georgismarkogiannis.com/sites/default/files/race/main_image/2022-06/Mugello-Header.jpeg",
    "https://s2-ge.glbimg.com/-BGPBl6P3vk9-UkH7Erwo8QqTks%3D/0x0%3A1600x1200/600x0/smart/filters%3Agifv%28%29%3Astrip_icc%28%29/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2020/a/A/GeoEDrShOmDbtBtEgFhQ/nfs-mania-carte-grande-bretagne-brands-hatch.jpg",
    "https://cdn-5.motorsport.com/images/amp/68ynndB0/s6/imola-circuit-aerial-view-1.jpg",
    "https://images.motorsport-magazin.com/images/1200/1200/1049962.jpg",
)

_BOOKING_REQUESTS = (
    ("Nairobi", "7 PM", 2, 4500), ("Nairobi", "8 PM", 4, 7000),
    ("Nairobi", "9 PM", 5, 9500), ("Mombasa", "7 PM", 2, 5000),
    ("Diani", "8 PM", 4, 8500), ("Diani", "8 PM", 3, 9000),
    ("Kisumu", "7 PM", 4, 6000), ("Nakuru", "8 PM", 5, 7500),
    ("Dubai", "7 PM", 2, 11000), ("Dubai", "9 PM", 4, 18000),
    ("Abu Dhabi", "8 PM", 3, 14000), ("Doha", "9 PM", 5, 16000),
    ("Kampala", "7 PM", 2, 5500), ("Kampala", "9 PM", 6, 12000),
    ("Dar es Salaam", "8 PM", 4, 8500), ("Zanzibar", "7 PM", 2, 10000),
    ("Kigali", "8 PM", 4, 9000), ("Lagos", "9 PM", 5, 17000),
    ("Accra", "8 PM", 3, 12500), ("Cape Town", "7 PM", 4, 15000),
    ("Johannesburg", "9 PM", 6, 18000), ("Mombasa", "9 PM", 5, 11000),
    ("Nairobi", "10 PM", 6, 13000), ("Dubai", "10 PM", 8, 26000),
    ("Abu Dhabi", "9 PM", 5, 21000), ("Doha", "8 PM", 2, 12000),
    ("Kigali", "9 PM", 2, 7000), ("Accra", "10 PM", 6, 22000),
    ("Cape Town", "9 PM", 5, 20000), ("Zanzibar", "8 PM", 4, 19000),
)

_RACE_TRACKS = (
    ("Bahrain International Circuit", "Sakhir, Bahrain", 9500),
    ("Jeddah Corniche Circuit", "Jeddah, Saudi Arabia", 11000),
    ("Lusail International Circuit", "Lusail, Qatar", 10000),
    ("Autódromo José Carlos Pace", "São Paulo, Brazil", 8000),
    ("Circuit of The Americas", "Austin, Texas, USA", 13500),
    ("Shanghai International Circuit", "Shanghai, China", 9000),
    ("Hungaroring", "Mogyoród, Hungary", 8500),
    ("Autodromo Nazionale Monza", "Monza, Italy", 12000),
    ("Circuit de Spa-Francorchamps", "Stavelot, Belgium", 12500),
    ("Silverstone Circuit", "Silverstone, United Kingdom", 14000),
    ("Suzuka International Racing Course", "Suzuka, Japan", 11500),
    ("Circuit de Monaco", "Monte Carlo, Monaco", 22000),
    ("Marina Bay Street Circuit", "Singapore", 18500),
    ("Albert Park Grand Prix Circuit", "Melbourne, Australia", 14500),
    ("Circuit Gilles-Villeneuve", "Montréal, Canada", 13000),
    ("Autódromo Hermanos Rodríguez", "Mexico City, Mexico", 10500),
    ("Miami International Autodrome", "Miami, Florida, USA", 16500),
    ("Circuit de Barcelona-Catalunya", "Montmeló, Spain", 11500),
    ("Circuit Zandvoort", "Zandvoort, Netherlands", 12500),
    ("Fuji Speedway", "Oyama, Japan", 9000),
    ("Sepang International Circuit", "Sepang, Malaysia", 7500),
    ("Circuit de la Sarthe", "Le Mans, France", 13500),
    ("Daytona International Speedway", "Daytona Beach, USA", 12000),
    ("Nürburgring", "Nürburg, Germany", 11000),
    ("Kyalami Grand Prix Circuit", "Midrand, South Africa", 8500),
    ("Phillip Island Grand Prix Circuit", "Ventnor, Australia", 9000),
    ("Mugello Circuit", "Scarperia e San Piero, Italy", 10500),
    ("Brands Hatch", "West Kingsdown, United Kingdom", 8000),
    ("Imola Circuit", "Imola, Italy", 10000),
    ("Red Bull Ring", "Spielberg, Austria", 11500),
)

DEMO_PRODUCTS += tuple(
    {
        "seed_key": f"nightlife-table-request-{index:02d}",
        "name": f"{city}, {time} — Table Request for {guests}",
        "description": f"KES {price:,} per person estimate. Example request only; no venue reservation or live availability is attached. Confirm details directly with a venue.",
        "price": str(price),
        "category": "Nightlife & Entertainment",
        "subcategory": "Booking Example",
        "image": _NIGHTLIFE_IMAGES[index - 1],
        "availability": True,
    }
    for index, (city, time, guests, price) in enumerate(_BOOKING_REQUESTS, start=1)
)

DEMO_PRODUCTS += tuple(
    {
        "seed_key": f"motorsports-track-location-{index:02d}",
        "name": f"{circuit} — Track Location",
        "description": f"{location}. Illustrative race-track image and KES {price:,} per-person activity estimate only; this is not a ticket or booking, and the image may not show this exact venue. Confirm current activities and prices with the official circuit.",
        "price": str(price),
        "category": "Motorsports",
        "subcategory": "Race Track Locations",
        "image": _RACE_TRACK_IMAGES[index - 1],
        "availability": True,
    }
    for index, (circuit, location, price) in enumerate(_RACE_TRACKS, start=1)
)




# Brand-specific product packshots and catalog-reference KES prices.
# Product availability remains a preview flag; live retailer inventory is not connected.
_PRODUCT_IMAGES = {
    "energy-red-bull": "https://www.kroger.com/product/images/xlarge/front/0061126999100",
    "energy-celsius": "https://i.honey-images.com/v4/200_3196c141aa5925997d3115dc6872d123.jpg",
    "energy-bang": "https://www.kroger.com/product/images/xlarge/front/0061076486365",
    "energy-rockstar": "https://images-cdn.ubuy.co.id/634fec591f0c133d931087b0-rockstar-original-energy-drink-16-oz-4.jpg",
    "energy-c4": "https://musclefoodsusa.com/wp-content/uploads/2020/03/c4batch.png",
    "energy-alani-nu": "https://webimages.theisens.com/asset/be8d85c4-c53d-4955-9915-ae29f4420398/Base/51326.jpg?width=256",
    "energy-reign": "https://www.instacart.com/image-server/1864x1864/www.instacart.com/assets/domains/product-image/file/large_a76255e9-a35f-4cfa-8f67-3642a98adc5b.png",
    "energy-nos": "https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_06d03e77-f7e5-4bfe-82d8-8a6127b269d2.PNG",
    "energy-5hour": "https://i5.walmartimages.com/seo/5-hour-ENERGY-Shot-Regular-Strength-Berry-4-Count_b03c48ab-11ee-4276-a2ec-ec04d8f56de3.48ea3b80a653c0152a0b2e1ff4593d09.jpeg",
    "energy-prime": "https://cdn.xxl.se/filespin/fab449343ad94315888ca93db62ea7ec?bgcolor=efefef&quality=75&resize=3840%2C3840",
    "energy-full-throttle": "https://i5.walmartimages.com/asr/a2b81678-0fc9-4835-a6e9-4b49e3a31176.e31a152d55cba629eaffba2cbbbf17b7.jpeg",
    "energy-kickstart": "https://i5.walmartimages.com/seo/Mountain-Dew-Kickstart-Energy-Drink-Orange-Citrus-Flavor-16-fl-oz-Can_d65dbe39-7ddc-4856-987d-79e82207a5c0.280ce4a029f53325e828bfe2e10165f2.jpeg",
    "energy-baya": "https://m.media-amazon.com/images/I/71qwZwmS1BL.jpg",
    "energy-venom": "https://cdn.shopify.com/s/files/1/0588/2701/4293/files/DW105670-24.png?v=1753405417",
    "energy-bloom": "https://i5.walmartimages.com/seo/BLOOM-SPARKLING-ENERGY-CRISP-APPLE-SINGLE-CAN-12OZ_18c960d2-5100-4cd2-baac-d67dd8c18321.968f86b07fd499cbd4a57ea557f3c3f1.png",
    "energy-zevia": "https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_97f29ac6-2cab-43cd-a124-f8ff15beb56b.jpg",
    "energy-gfuel": "https://www.sweet-joint.com/cdn/shop/files/Gfuel-Energy-Drink-Fazeberry.png?v=1768635527",
    "energy-amp": "https://www.instacart.com/assets/domains/product-image/file/large_43299c0a-8d82-4b01-8db4-6c2bb5786743.png",
    "spirit-titos": "https://supermercadosnacional.com/media/catalog/product/2/1/2156261-1.jpg",
    "spirit-smirnoff": "https://hebmx.vtexassets.com/arquivos/ids/786989-800-800?aspect=true&height=800&v=638591787068170000&width=800",
    "spirit-absolut": "https://m.media-amazon.com/images/I/51eqJ23xGML._AC_SL1500_.jpg",
    "spirit-grey-goose": "https://thebarrel.au/cdn/shop/files/Grey-Goose-Vodka.png?v=1684999001",
    "spirit-ketel-one": "https://cdn.shoplightspeed.com/shops/643460/files/31876603/spirits-ketel-one-vodka-750ml.jpg",
    "spirit-svedka": "https://i5.walmartimages.com/seo/SVEDKA-Vodka-750-ml-Bottle-40-ABV_5da3970e-14f5-4931-9ee9-b09371d7302a.69c26ef32888ace943683c92e077eef1.jpeg",
    "spirit-new-amsterdam": "https://images.gopuff.com/resize/cf/version%3D1_2%2Cformat%3Dauto%2Cfit%3Dscale-down%2Cquality%3D70%2Cwidth%3D1600%2Cheight%3D1600/https%3A/images.gopuff.com/blob/gopuffcatalogstorageprod/catalog-images-container/resize/cf/version%3D1_2%2Cformat%3Dauto%2Cfit%3Dscale-down%2Cwidth%3D800%2Cheight%3D800/0ebaba94-81b3-4edd-a01d-7996a1e6ca86.png",
    "spirit-skyy": "https://elitclub.kz/upload/images/88084_163986_04.jpg",
    "spirit-ciroc": "https://digitalcontent.api.tesco.com/v2/media/ghs/157a8dbb-bdd9-4f76-a849-f7e98ea29411/0872fe2d-a520-423d-a983-8e3c005fe3e2_1091460546.jpeg",
    "spirit-deep-eddy": "https://cdn11.bigcommerce.com/s-t5ovgcn8tc/images/stencil/640w/products/28547/44264/70f439717110d952c69ba999fdb0e4a96209f71f__78207.1.jpg",
    "spirit-jack-daniels": "https://cdn11.bigcommerce.com/s-q90i85/images/stencil/1280x1280/products/100/1222/jd__22999.1682749666.png?c=2",
    "spirit-jim-beam": "https://dojiw2m9tvv09.cloudfront.net/79333/product/dsc088896379.jpg?123=&t=1783192131",
    "spirit-crown-royal": "https://bdliquorwine.com/cdn/shop/products/Crown-Royal-Canadian-Whiskey-Crown-Royal-1610022369_d750a798-fbc0-46cd-9a79-1db6bf4e4452_2000x.jpg?v=1631046394",
    "spirit-fireball": "https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_6cd036de-4b2e-4497-9f4c-3c9aa4b0239a.jpg",
    "spirit-makers-mark": "https://boozeshop.ph/cdn/shop/files/Maker_sMark750ml.png?v=1744277639",
    "spirit-jameson": "https://cdn.shopify.com/s/files/1/0573/0549/7766/files/jamesonirishwhiskey.webp?v=1722637029",
    "spirit-buffalo-trace": "https://s.yimg.com/ny/api/res/1.2/4faqsK8cuTuqKFr5ncpuqA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTk2MA--/https%3A/media.zenfs.com/en/apartment_therapy_269/524c55de253b6297bc9de630ffd336ff",
    "spirit-bulleit": "https://daydram.com/cdn/shop/files/BulleitBourbon.png?v=1740443398",
    "spirit-woodford": "https://www.mensjournal.com/.image/MjA1NDMzMzE1MTc0MzkzODEy/woodford-reserve-kentucky-straight-bourbon-whiskey.png?profile=w2560&x=50&y=50",
    "spirit-evan-williams": "https://cdn.shopify.com/s/files/1/0635/3289/2418/files/buy-evan-williams-bourbon__11459.jpg?v=1687156448",
    "spirit-wild-turkey": "https://sailinliquor.com/cdn/shop/files/246429151.png?v=1763944659",
    "spirit-four-roses": "https://whisky.nl/media/catalog/product/f/o/four-roses-bourbon-whiskey-70cl.jpg?height=1400&image-type=image&store=whisky_nl&width=1400",
    "spirit-knob-creek": "https://www.thebarreltap.com/cdn/shop/files/knob-creek-9-year-bourbon-whiskey-100-proof-the-barrel-tap-www-thebarreltap-com.jpg?v=1691179497",
    "spirit-basil-hayden": "https://target.scene7.com/is/image/Target/GUEST_28ab4260-28a1-4c03-848e-d69ff2b3c363",
    "spirit-johnnie-walker": "https://executiveretailshops.com/cdn/shop/files/Johnnie-Walker-Red-Label.jpg?v=1700158169",
    "spirit-dewars": "https://heavyliquor.com/cdn/shop/files/res_644ccccbb471389b7385f2a149ae859f.jpg?v=1764421405",
    "spirit-glenlivet": "https://api-runner.a-ok.app/static/images/aok2_9-R806zJO6pTvaRGAHEjmHOvyUQ4J5VMnhDmwbrTZEo_-PigMZvdCN6UeESjtF0O4ytbCHA36MnvLcRjdjgukktc75i5nG8sW88FrdA5vWTmtIbgrcbhcbA8qUvPZYoCNCcNmqubU73Of7BVv4U_Yt6ZhzBxuoaPuRh3ZXn7oRCDHqnB54",
    "spirit-patron": "https://www.patrontequila.com/binaries/content/gallery/patrontequila/products/patron-silver/2025_bottle_silver.png",
    "spirit-don-julio": "https://whiskyandwhiskey.com/cdn/shop/files/don-julio-blanco-tequila__001_bf2e4865-3b92-4a82-8bab-36e7c845d781.jpg?v=1762056885&width=1200",
    "spirit-casamigos": "https://whiskyandwhiskey.com/cdn/shop/files/casamigos-blanco-tequila__001_409b8dc7-bbbd-46e9-b088-70ecd431d044.jpg?v=1762056877&width=2048",
    "spirit-jose-cuervo": "https://images.tcdn.com.br/img/img_prod/1383230/tequila_jose_cuervo_especial_ouro_750ml_1875_1_21d7f3906f09d1e08b8f00b5c613421b.jpg",
    "spirit-espolon": "https://whiskeycaviar.com/cdn/shop/files/espolon.jpg?v=1717250137",
    "spirit-1800": "https://secretbottleshop.co.uk/cdn/shop/files/a87d1baa-d795-4aa9-84e6-00b38221a9d9.jpg?v=1741792104",
    "spirit-herradura": "https://cdn.awsli.com.br/1231/1231345/produto/326410870/tequila-herradura-plata-jiaj6kq9v7.jpg",
    "spirit-teremana": "https://i5.walmartimages.cl/asr/a8628c01-d459-401a-ae4c-1ba9e862c3a5.931d856989d85397db96617352c973d0.png?odnBg=ffffff&odnHeight=2000&odnWidth=2000",
    "spirit-bacardi": "https://wine.sothebys.com/cdn/shop/files/BSRM75.jpg?v=1726587127",
    "spirit-captain-morgan": "https://caskcartel.com/cdn/shop/products/CaptainMorganSpiced_1400x.jpg?v=1569248935",
    "spirit-malibu": "https://assets.superliquor.co.nz/thumbs/0018159.png",
    "spirit-kraken": "https://spliquor.ca/cdn/shop/files/TheKrakenBlackSpicedRum750mL.jpg?v=1772129771",
    "spirit-sailor-jerry": "https://raretequilas.com/cdn/shop/products/Studio_Project-2022-05-27T104744.179_1200x1200.jpg?v=1660770580",
    "spirit-cruzan": "https://www.bswliquor.com/cdn/shop/files/CZ_Batch1_PDP_Card_Option1_R03_1000x1000_AgedLight_png.webp?v=1753126211",
    "spirit-tanqueray": "https://thewinebox.biz/wp-content/uploads/2022/02/tanqueray-london-dry-gin.png",
    "spirit-bombay-sapphire": "https://thewinebox.biz/wp-content/uploads/2022/01/bombay-sapphire-gin-1.png",
    "spirit-beefeater": "https://www.campoluzenoteca.com/8525-large_default/beefeater.jpg",
    "spirit-hendricks": "https://mrliquor.com.au/cdn/shop/products/Hendrick_s_Gin_700mL-1.jpg?v=1573617605",
    "spirit-gordons": "https://centurywines.com.sg/cdn/shop/files/CWS00684_Gordon_sGin700ml_550x.jpg?v=1761292694",
    "spirit-baileys": "https://www.centrobibite.it/2395-thickbox_default/liquore-baileys-original-irish-cream-1-lt.jpg",
    "spirit-jagermeister": "https://boozeone.ph/cdn/shop/files/95.png?v=1696384136&width=1500",
    "spirit-hennessy": "https://i5.walmartimages.com/seo/Hennessy-VS-Cognac-750-ml-Glass-Bottle-40-ABV_42cd752f-e7e8-4009-b570-e29c528a8403.adf5a428f4d806ed94f723c642e8d1ef.png?odnBg=FFFFFF&odnHeight=768&odnWidth=768",
    "spirit-kahlua": "https://www.wholesales.co.ug/wp-content/uploads/2019/03/pral28.jpg.jpg",
    "rtd-white-claw": "https://images.gopuff.com/blob/gopuffcatalogstorageprod/catalog-images-container/resize/cf/version%3D1_2%2Cformat%3Dauto%2Cfit%3Dscale-down%2Cwidth%3D800%2Cheight%3D800/c127f1c2-10c1-495b-8ffd-c70c66803e92-background_removed.png",
    "rtd-truly": "https://assets.untappd.com/photos/2026_05_02/ac87589d3e6a177c756adb2d810e22a1_c_1567323774_raw.jpg",
    "rtd-high-noon": "https://images.gopuff.com/blob/gopuffcatalogstorageprod/catalog-images-container/resize/cf/version%3D1_0%2Cformat%3Dauto%2Cfit%3Dscale-down%2Cwidth%3D800%2Cheight%3D800/a024a5d1-1046-46e7-81b0-e5679d34bfc8.png",
    "rtd-cutwater": "https://assets.liquidcommerce.co/catalog/partner/img/1f76b184-2006-440f-ad00-f81b8eff2601.jpg",
    "rtd-buzzballz": "https://spirits4less.com/cdn/shop/files/BUZZBALLZ_COCKTAILS_PASSIONFRUIT_MARTINI_200ML.webp?v=1762297265&width=1946",
    "rtd-twisted-tea": "https://d2j6dbq0eux0bg.cloudfront.net/images/31078077/5110460679.jpg",
    "rtd-smirnoff-ice": "https://kansasfoodmarket.com/cdn/shop/products/ci-smirnoff-ice-164a53e87d3b435f_580x.jpg?v=1594873446",
    "rtd-mikes-hard": "https://www.kroger.com/product/images/xlarge/front/0063598500024",
    "rtd-surfside": "https://store.statesidevodka.com/cdn/shop/products/surfside-front_1e388430-489b-42ca-801e-2c241db74a64_1200x1200.png?v=1707495267",
    "rtd-nutrl": "https://media-s3-us-east-1.ceros.com/labatt/images/2024/06/03/26e1f234e174a154f62d4a1f871bb3d3/21nvs-lemon-355-shadow-rgb.png",
    "rtd-fresca": "https://photos-us.bazaarvoice.com/photo/2/cGhvdG86Y29uc3RlbGxhdGlvbmJyYW5kcw/d6ff5ece-c2b8-5abc-8637-057e81ff0586",
    "rtd-vizzy": "https://aem.lcbo.com/content/dam/lcbo/products/0/2/4/3/024388.jpg.thumb.1280.1280.jpg",
    "rtd-press": "https://d2iiahg0ip5afn.cloudfront.net/media/press/images/875333496.press-12oz-alcseltzer-pearchamomile.jpg",
    "rtd-jd-coke": "https://www.brown-forman.com/sites/default/files/styles/576x576_no_cropping/public/salsify_images/b81e20846abbeefad3de8dc5231364ec73a8e8bc.png?itok=ffwoexu8",
    "rtd-crown-royal": "https://www.reservebar.com/_next/image?q=75&url=https%3A%2F%2Fassets.liquidcommerce.co%2Fcatalog%2Fpartner%2Fimg%2F42d20f90-eaa9-4335-aba7-565f3603ec1e.jpg&w=1920",
    "rtd-four-loko": "https://cdn11.bigcommerce.com/s-h556z48a5y/images/stencil/1280x1280/products/5610/11579/84980600116__41265.1619118565.jpg?c=1",
    "rtd-seagrams": "https://images.gopuff.com/blob/gopuffcatalogstorageprod/catalog-images-container/resize/cf/version%3D1_2%2Cformat%3Dauto%2Cfit%3Dscale-down%2Cwidth%3D800%2Cheight%3D800/88dab124-f4dd-45d7-a432-7d26a8e023d5-padded.png",
    "rtd-topo-chico": "https://www.coca-cola.com/content/dam/onexp/gb/en/brands/topo-chico/Product-Information-Topo-Chico-Tangy-Lemon-Lime.jpg",
    "streetwear-band-tee": "https://media-assets.grailed.com/prd/listing/43113156/20869745c02f4d8abb638795292de3fb?auto=format",
    "streetwear-moto-jacket": "https://www.vickyabbeyliquidation.ca/cdn/shop/files/ED944FE3-C41E-4156-84FF-1357ED4EBBFE.jpg?v=1715573186&width=1946",
    "streetwear-combat-boots": "https://item.elandrs.com/r/image/item/2024-11-03/454e0520-d290-4cf5-bdbc-17dd588f4030.jpg",
    "analog-turntable": "https://cdn11.bigcommerce.com/s-1xa2dhlu0a/images/stencil/500x659/products/72567/102795/APJTTATMTA1B__39346.1658002535.jpg?c=1",
    "analog-cassette-pack": "https://images.unsplash.com/photo-1576228290547-b7e32fe598d0?fm=jpg&ixlib=rb-4.0.3&q=80&w=1200",
    "afterdark-bralette": "https://fielshop.com/cdn/shop/products/black-sexy-perspective-lace-bra-bralettes-sunny-angela-296.jpg?v=1693217584",
    "afterdark-briefs": "https://image.hm.com/assets/005/be/87/be8707d1ab1dad564e7b2659440c07e9ce536baa.jpg?imwidth=2160",
    "vape-wenax-aurora-green": "https://ossus.geekvape.com/products/WQP/AuroraGreen.png",
    "vape-wenax-black": "https://ossus.geekvape.com/products/WQP/Black.png",
    "vape-wenax-sunburst-gold": "https://ossus.geekvape.com/products/WQP/SunburstGold.png",
    "vape-wenax-luminous-purple": "https://ossus.geekvape.com/products/WQP/LuminousPurple.png",
    "vape-wenax-twilight-red": "https://ossus.geekvape.com/products/WQP/TwilightRed.png",
    "cruise-virgin-miami": "https://virginvoyages.imgix.net/dam/jcr%3A6b35a588-25ca-49c9-8648-4dfd82debcb9/Resilient%20lady-892x1266-tablet.png?auto=format%2Ccompress&fit=max&q=75&w=750",
    "cruise-virgin-barcelona": "https://virginvoyages.imgix.net/dam/jcr%3A6b35a588-25ca-49c9-8648-4dfd82debcb9/Resilient%20lady-892x1266-tablet.png?auto=format%2Ccompress&fit=max&q=75&w=750",
    "cruise-virgin-athens": "https://virginvoyages.imgix.net/dam/jcr%3A6b35a588-25ca-49c9-8648-4dfd82debcb9/Resilient%20lady-892x1266-tablet.png?auto=format%2Ccompress&fit=max&q=75&w=750"
}

_MARKET_PRODUCTS = (
    ("energy-red-bull", "Red Bull Energy Drink", "Energy Drinks", "Can", "250"),
    ("energy-celsius", "Celsius Sparkling Orange Energy Drink", "Energy Drinks", "Can", "400"),
    ("energy-bang", "Bang Energy Star Blast", "Energy Drinks", "Can", "350"),
    ("energy-rockstar", "Rockstar Original Energy Drink", "Energy Drinks", "Can", "300"),
    ("energy-c4", "C4 Energy Sour Batch Bros", "Energy Drinks", "Can", "400"),
    ("energy-alani-nu", "Alani Nu Cosmic Stardust", "Energy Drinks", "Can", "400"),
    ("energy-reign", "Reign Total Body Fuel Tropical Storm", "Energy Drinks", "Can", "350"),
    ("energy-nos", "NOS Original Energy Drink", "Energy Drinks", "Can", "300"),
    ("energy-5hour", "5-hour Energy Berry Shot", "Energy Drinks", "Energy Shots", "350"),
    ("energy-prime", "Prime Energy Blue Raspberry", "Energy Drinks", "Can", "350"),
    ("energy-full-throttle", "Full Throttle Original Citrus", "Energy Drinks", "Can", "300"),
    ("energy-kickstart", "Mountain Dew Kickstart Orange Citrus", "Energy Drinks", "Can", "250"),
    ("energy-baya", "Starbucks Baya Energy Mango Guava", "Energy Drinks", "Can", "350"),
    ("energy-venom", "Venom Energy Black Cherry Kiwi", "Energy Drinks", "Can", "250"),
    ("energy-bloom", "Bloom Sparkling Energy Crisp Apple", "Energy Drinks", "Can", "350"),
    ("energy-zevia", "Zevia Energy Kola", "Energy Drinks", "Can", "300"),
    ("energy-gfuel", "G FUEL Fazeberry Energy Drink", "Energy Drinks", "Can", "350"),
    ("energy-amp", "Mountain Dew Amp Original Citrus", "Energy Drinks", "Can", "300"),
    ("spirit-titos", "Tito's Handmade Vodka 750 mL", "Spirits", "Vodka", "3500"),
    ("spirit-smirnoff", "Smirnoff No. 21 Vodka 750 mL", "Spirits", "Vodka", "2200"),
    ("spirit-absolut", "Absolut Vodka 750 mL", "Spirits", "Vodka", "3200"),
    ("spirit-grey-goose", "Grey Goose Vodka 750 mL", "Spirits", "Vodka", "8500"),
    ("spirit-ketel-one", "Ketel One Vodka 750 mL", "Spirits", "Vodka", "4200"),
    ("spirit-svedka", "Svedka Vodka 750 mL", "Spirits", "Vodka", "2800"),
    ("spirit-new-amsterdam", "New Amsterdam Vodka 750 mL", "Spirits", "Vodka", "2200"),
    ("spirit-skyy", "SKYY Vodka 750 mL", "Spirits", "Vodka", "2800"),
    ("spirit-ciroc", "Cîroc Vodka 750 mL", "Spirits", "Vodka", "9000"),
    ("spirit-deep-eddy", "Deep Eddy Original Vodka 750 mL", "Spirits", "Vodka", "3900"),
    ("spirit-jack-daniels", "Jack Daniel's Old No. 7 Tennessee Whiskey 750 mL", "Spirits", "Whiskey & Bourbon", "4000"),
    ("spirit-jim-beam", "Jim Beam Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "3200"),
    ("spirit-crown-royal", "Crown Royal Deluxe Canadian Whisky 750 mL", "Spirits", "Whiskey & Bourbon", "6000"),
    ("spirit-fireball", "Fireball Cinnamon Whisky 750 mL", "Spirits", "Whiskey & Bourbon", "2500"),
    ("spirit-makers-mark", "Maker's Mark Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "5300"),
    ("spirit-jameson", "Jameson Irish Whiskey 750 mL", "Spirits", "Whiskey & Bourbon", "4600"),
    ("spirit-buffalo-trace", "Buffalo Trace Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "4500"),
    ("spirit-bulleit", "Bulleit Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "5200"),
    ("spirit-woodford", "Woodford Reserve Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "6500"),
    ("spirit-evan-williams", "Evan Williams Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "3000"),
    ("spirit-wild-turkey", "Wild Turkey 101 Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "4000"),
    ("spirit-four-roses", "Four Roses Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "4200"),
    ("spirit-knob-creek", "Knob Creek 9 Year Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "5800"),
    ("spirit-basil-hayden", "Basil Hayden's Bourbon 750 mL", "Spirits", "Whiskey & Bourbon", "6500"),
    ("spirit-johnnie-walker", "Johnnie Walker Red Label Scotch Whisky 750 mL", "Spirits", "Whiskey & Bourbon", "3800"),
    ("spirit-dewars", "Dewar's White Label Scotch Whisky 750 mL", "Spirits", "Whiskey & Bourbon", "3800"),
    ("spirit-glenlivet", "The Glenlivet 12 Year Single Malt Scotch 750 mL", "Spirits", "Whiskey & Bourbon", "7500"),
    ("spirit-patron", "Patrón Silver Tequila 750 mL", "Spirits", "Tequila", "9000"),
    ("spirit-don-julio", "Don Julio Blanco Tequila 750 mL", "Spirits", "Tequila", "9500"),
    ("spirit-casamigos", "Casamigos Blanco Tequila 750 mL", "Spirits", "Tequila", "8500"),
    ("spirit-jose-cuervo", "José Cuervo Especial Gold Tequila 750 mL", "Spirits", "Tequila", "3500"),
    ("spirit-espolon", "Espolòn Blanco Tequila 750 mL", "Spirits", "Tequila", "5500"),
    ("spirit-1800", "1800 Silver Tequila 750 mL", "Spirits", "Tequila", "6500"),
    ("spirit-herradura", "Herradura Plata Tequila 750 mL", "Spirits", "Tequila", "7500"),
    ("spirit-teremana", "Teremana Blanco Tequila 750 mL", "Spirits", "Tequila", "6000"),
    ("spirit-bacardi", "Bacardí Superior White Rum 750 mL", "Spirits", "Rum", "3000"),
    ("spirit-captain-morgan", "Captain Morgan Original Spiced Rum 750 mL", "Spirits", "Rum", "3200"),
    ("spirit-malibu", "Malibu Original Coconut Rum 750 mL", "Spirits", "Rum", "3000"),
    ("spirit-kraken", "The Kraken Black Spiced Rum 750 mL", "Spirits", "Rum", "5500"),
    ("spirit-sailor-jerry", "Sailor Jerry Spiced Rum 750 mL", "Spirits", "Rum", "4500"),
    ("spirit-cruzan", "Cruzan Aged Light Rum 750 mL", "Spirits", "Rum", "3500"),
    ("spirit-tanqueray", "Tanqueray London Dry Gin 750 mL", "Spirits", "Gin", "4500"),
    ("spirit-bombay-sapphire", "Bombay Sapphire Gin 750 mL", "Spirits", "Gin", "5000"),
    ("spirit-beefeater", "Beefeater London Dry Gin 750 mL", "Spirits", "Gin", "4200"),
    ("spirit-hendricks", "Hendrick's Gin 750 mL", "Spirits", "Gin", "8000"),
    ("spirit-gordons", "Gordon's London Dry Gin 750 mL", "Spirits", "Gin", "3000"),
    ("spirit-baileys", "Baileys Original Irish Cream 750 mL", "Spirits", "Liqueurs & Cognac", "3800"),
    ("spirit-jagermeister", "Jägermeister Herbal Liqueur 700 mL", "Spirits", "Liqueurs & Cognac", "4200"),
    ("spirit-hennessy", "Hennessy VS Cognac 750 mL", "Spirits", "Liqueurs & Cognac", "8500"),
    ("spirit-kahlua", "Kahlúa Coffee Liqueur 700 mL", "Spirits", "Liqueurs & Cognac", "3500"),
    ("rtd-white-claw", "White Claw Surge Lime Hard Seltzer", "Mixed Drinks & Hard Seltzers", "Hard Seltzers", "350"),
    ("rtd-truly", "Truly R. Lime Hard Seltzer", "Mixed Drinks & Hard Seltzers", "Hard Seltzers", "350"),
    ("rtd-high-noon", "High Noon Lemon Vodka Soda", "Mixed Drinks & Hard Seltzers", "Vodka Sodas", "450"),
    ("rtd-cutwater", "Cutwater Piña Colada Canned Cocktail", "Mixed Drinks & Hard Seltzers", "Canned Cocktails", "650"),
    ("rtd-buzzballz", "BuzzBallz Passionfruit Martini", "Mixed Drinks & Hard Seltzers", "Canned Cocktails", "450"),
    ("rtd-twisted-tea", "Twisted Tea Original Hard Iced Tea", "Mixed Drinks & Hard Seltzers", "Malt Beverages", "350"),
    ("rtd-smirnoff-ice", "Smirnoff Ice Original", "Mixed Drinks & Hard Seltzers", "Malt Beverages", "350"),
    ("rtd-mikes-hard", "Mike's Hard Lemonade Original", "Mixed Drinks & Hard Seltzers", "Malt Beverages", "350"),
    ("rtd-surfside", "Surfside Iced Tea + Vodka", "Mixed Drinks & Hard Seltzers", "Vodka Sodas", "450"),
    ("rtd-nutrl", "Nütrl Lemon Vodka Soda", "Mixed Drinks & Hard Seltzers", "Vodka Sodas", "450"),
    ("rtd-fresca", "Fresca Mixed Vodka Spritz", "Mixed Drinks & Hard Seltzers", "Canned Cocktails", "450"),
    ("rtd-vizzy", "Vizzy Hard Seltzer", "Mixed Drinks & Hard Seltzers", "Hard Seltzers", "350"),
    ("rtd-press", "PRESS Pear Chamomile Hard Seltzer", "Mixed Drinks & Hard Seltzers", "Hard Seltzers", "450"),
    ("rtd-jd-coke", "Jack Daniel's & Coca-Cola", "Mixed Drinks & Hard Seltzers", "Canned Cocktails", "450"),
    ("rtd-crown-royal", "Crown Royal Whisky & Cola", "Mixed Drinks & Hard Seltzers", "Canned Cocktails", "450"),
    ("rtd-four-loko", "Four Loko Gold", "Mixed Drinks & Hard Seltzers", "Malt Beverages", "450"),
    ("rtd-seagrams", "Seagram's Escapes Jamaican Me Happy", "Mixed Drinks & Hard Seltzers", "Malt Beverages", "350"),
    ("rtd-topo-chico", "Topo Chico Tangy Lemon Lime Hard Seltzer", "Mixed Drinks & Hard Seltzers", "Hard Seltzers", "400"),
)

_ADDITIONAL_MARKET_PRODUCTS = (
    ("streetwear-band-tee", "Vintage Soundgarden Tour Graphic Tee", "Streetwear & Footwear", "Graphic Tees", "2400"),
    ("streetwear-moto-jacket", "Black Moto Leather Jacket", "Streetwear & Footwear", "Outerwear", "12500"),
    ("streetwear-combat-boots", "Black Leather Combat Boots", "Streetwear & Footwear", "Footwear", "9800"),
    ("analog-turntable", "Black Vinyl Turntable", "Vinyl & Analog", "Turntables", "18500"),
    ("analog-cassette-pack", "Black Audio Cassette Tape", "Vinyl & Analog", "Cassettes", "900"),
    ("afterdark-bralette", "Black Lace Bralette", "After Dark Intimates", "Lingerie", "2800"),
    ("afterdark-briefs", "Black High-Rise Briefs", "After Dark Intimates", "Underwear", "1600"),
    ("vape-wenax-aurora-green", "Geekvape Wenax Q Pro — Aurora Green", "Vapes & Pod Kits", "Pod Kits", "4200"),
    ("vape-wenax-black", "Geekvape Wenax Q Pro — Black", "Vapes & Pod Kits", "Pod Kits", "4200"),
    ("vape-wenax-sunburst-gold", "Geekvape Wenax Q Pro — Sunburst Gold", "Exotic Vapes", "Color-Finish Pod Kits", "4500"),
    ("vape-wenax-luminous-purple", "Geekvape Wenax Q Pro — Luminous Purple", "Exotic Vapes", "Color-Finish Pod Kits", "4500"),
    ("vape-wenax-twilight-red", "Geekvape Wenax Q Pro — Twilight Red", "Exotic Vapes", "Color-Finish Pod Kits", "4500"),
    ("cruise-virgin-miami", "Adults-Only Caribbean Cruise — Miami Departure Request", "Adult-Only Cruises", "Caribbean Voyages", "185000"),
    ("cruise-virgin-barcelona", "Adults-Only Mediterranean Cruise — Barcelona Departure Request", "Adult-Only Cruises", "Mediterranean Voyages", "225000"),
    ("cruise-virgin-athens", "Adults-Only Mediterranean Cruise — Athens Departure Request", "Adult-Only Cruises", "Mediterranean Voyages", "215000"),
)
_MARKET_PRODUCTS = _ADDITIONAL_MARKET_PRODUCTS + _MARKET_PRODUCTS

DEMO_PRODUCTS += tuple(
    {
        "seed_key": key,
        "name": name,
        "description": (
            (
                "Age-restricted alcoholic beverage. "
                if category in ("Spirits", "Mixed Drinks & Hard Seltzers")
                else "Age-restricted vape device; device only, e-liquid sold separately. Confirm applicable local age and sales rules. "
                if category in ("Vapes & Pod Kits", "Exotic Vapes")
                else ""
            )
            + (
                "Adults-only cruise inquiry. This is a request listing, not a confirmed reservation; sailing dates, route, fare, and availability must be confirmed with the operator. "
                if category == "Adult-Only Cruises"
                else ""
            )
            + f"Approximate KES {int(price):,} reference price; photo shows the named product or experience. Live stock, reservations, and checkout are not connected."
        ),
        "price": price,
        "category": category,
        "subcategory": subcategory,
        "image": _PRODUCT_IMAGES[key],
        "availability": True,
    }
    for key, name, category, subcategory, price in _MARKET_PRODUCTS
)

def seed_underground_products(vendor_ids):
    vendor_ids = tuple(vendor_ids)
    if not vendor_ids or any(type(v) is not int or v < 1 for v in vendor_ids):
        raise ValueError("At least one existing positive integer user ID is required.")

    existing = {p.seed_key: p for p in UndergroundProduct.query.all()}
    for index, seed_product in enumerate(DEMO_PRODUCTS):
        data = {k: v for k, v in seed_product.items() if k != "seed_key"}
        validated = underground_product_schema.load(
            {**data, "vendor_id": vendor_ids[index % len(vendor_ids)]}
        )
        validated["price"] = Decimal(validated["price"])

        row = existing.get(seed_product["seed_key"])
        if row is None:
            row = UndergroundProduct(seed_key=seed_product["seed_key"])
            db.session.add(row)
        for field, value in validated.items():
            setattr(row, field, value)

    db.session.commit()
    return len(DEMO_PRODUCTS)


def seed_database():
    app = create_app()
    with app.app_context():
        vendor_ids = [uid for (uid,) in db.session.query(User.id).order_by(User.id).all()]
        if not vendor_ids:
            raise RuntimeError(
                "Create at least one Community Cart user before seeding Underground."
            )
        count = seed_underground_products(vendor_ids)
        print(f"Synchronized {count} Underground demo catalog products.")


if __name__ == "__main__":
    seed_database()
