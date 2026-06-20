/**
 * Manually adds the remaining missing countries to known_cities.json
 * with real, curated data (no synthetic/fake names).
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'known_cities.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

if (!db.cities) db.cities = {};
if (!db.regions) db.regions = {};

const newCities = {
  // ── TUNISIA ──
  "tunis": {
    name: "Tunis", country: "Tunisia", state: "Tunis Governorate",
    landmarks: ["Medina of Tunis (UNESCO)", "Bardo National Museum", "Zitouna Mosque", "Carthage Ruins", "Sidi Bou Said village", "Bab el-Bhar (Sea Gate)", "El-Halfaouine Square", "Belvedere Park"],
    neighborhoods: ["Medina", "Sidi Bou Said", "La Marsa", "Carthage", "Les Berges du Lac"],
    food: ["Brik (crispy egg pastry)", "Couscous with lamb", "Lablabi (chickpea soup)", "Merguez sausage", "Tunisian Harissa", "Makroudh (date pastry)", "Café de Paris on Avenue Bourguiba"],
    activities: ["Exploring the ancient Medina souks", "Day trip to Sidi Bou Said's blue-and-white village", "Visiting Carthage archaeological ruins", "Bardo Museum mosaics tour", "Swimming at La Marsa beach"],
    shopping: ["Medina souks for handicrafts and spices", "Avenue Habib Bourguiba shops", "Souk El Attarine for perfumes", "Souk des Chechias for traditional hats"],
    culture: ["Bardo National Museum (world's largest mosaic collection)", "Zitouna Mosque (oldest mosque in Africa)", "Dar Ben Abdallah Museum", "Salammbo Tophet archaeological site"]
  },
  "sfax": {
    name: "Sfax", country: "Tunisia", state: "Sfax Governorate",
    landmarks: ["Sfax Medina Walls", "Great Mosque of Sfax", "Dar Jellouli Museum", "Sfax Archaeological Museum"],
    neighborhoods: ["Medina", "Ville Nouvelle", "El Aïn"],
    food: ["Ojja (eggs in spicy tomato)", "Grilled seafood", "Tuna with harissa", "Makroudh"],
    activities: ["Exploring the ancient walled medina", "Day trip to Kerkennah Islands", "Sfax port waterfront walk"],
    shopping: ["Medina souks", "Sfax central market"],
    culture: ["Dar Jellouli Museum of folk arts", "Great Mosque of Sfax"]
  },

  // ── MOROCCO ──
  "marrakech": {
    name: "Marrakech", country: "Morocco", state: "Marrakech-Safi",
    landmarks: ["Jemaa el-Fna Square", "Koutoubia Mosque", "Bahia Palace", "El Badi Palace", "Saadian Tombs", "Majorelle Garden", "Medina of Marrakech (UNESCO)", "Ben Youssef Madrasa"],
    neighborhoods: ["Medina (Old City)", "Gueliz (Nouvelle Ville)", "Palmeraie", "Mellah (Jewish Quarter)"],
    food: ["Tagine (slow-cooked stew)", "Couscous with seven vegetables", "Pastilla (pigeon pie)", "Moroccan mint tea", "Msemen (Moroccan flatbread)", "Mechoui (whole-roasted lamb)", "Djemaa el-Fna food stalls at night"],
    activities: ["Watching snake charmers at Jemaa el-Fna", "Getting lost in the souks of the Medina", "Hammam experience at Hammam El Bacha", "Hot air balloon ride over Palmeraie at sunrise", "Camel ride at the Palmeraie"],
    shopping: ["Medina souks for leather goods and spices", "Souk Semmarine for carpets and textiles", "Mellah silver market", "Gueliz for modern boutiques"],
    culture: ["Ben Youssef Madrasa (14th-century Islamic school)", "Majorelle Garden and Berber Museum", "Maison de la Photographie", "Museum of Confluences"]
  },
  "fes": {
    name: "Fes", country: "Morocco", state: "Fès-Meknès",
    landmarks: ["Fes el-Bali Medina (UNESCO)", "Al-Qarawiyyin University", "Bou Inania Madrasa", "Chouara Tanneries", "Bab Bou Jeloud Gate (Blue Gate)", "Merenid Tombs", "Dar Batha Palace"],
    neighborhoods: ["Fes el-Bali", "Fes el-Jdid", "Ville Nouvelle"],
    food: ["Pastilla (pigeon pie)", "Tagine with preserved lemon", "Harira soup", "Msemen", "Bastilla au lait (milk pastilla dessert)", "Street food near Bab Bou Jeloud"],
    activities: ["Watching leather dyeing at Chouara Tanneries from rooftop", "Walking the 9,400 medieval alleys of Fes el-Bali", "Visiting Al-Qarawiyyin, the world's oldest university", "Evening promenade on the ramparts"],
    shopping: ["Medina artisan souks", "Potters Quarter (Ain Nokbi)", "Souk Attarin for spices", "Bab Guissa antiques"],
    culture: ["Bou Inania Madrasa architecture", "Dar Batha Museum of Moroccan arts", "Museum of Wooden Arts and Crafts"]
  },
  "casablanca": {
    name: "Casablanca", country: "Morocco", state: "Casablanca-Settat",
    landmarks: ["Hassan II Mosque", "Corniche Ain Diab", "Mohammed V Square", "Old Medina", "Art Deco Architecture", "Morocco Mall", "Sacré-Cœur Cathedral"],
    neighborhoods: ["Maarif", "Anfa", "Old Medina", "Ain Diab"],
    food: ["Moroccan seafood (fresh from the Atlantic)", "Tagine", "Pastilla", "Casa Seafood restaurants on the Corniche", "Rick's Café (iconic restaurant)"],
    activities: ["Visiting Hassan II Mosque (third largest in world)", "Strolling along the Atlantic Corniche", "Day trip to nearby Rabat", "Exploring Art Deco architecture downtown"],
    shopping: ["Morocco Mall", "Maarif boutiques", "Twin Center shopping"],
    culture: ["Hassan II Mosque (tours available)", "Villa des Arts", "Musée de la Résistance"]
  },

  // ── MYANMAR ──
  "bagan": {
    name: "Bagan", country: "Myanmar", state: "Mandalay Region",
    landmarks: ["Ananda Temple", "Shwezigon Pagoda", "Sulamani Temple", "Dhammayangyi Temple", "Htilominlo Temple", "Bulethi Pagoda viewpoint", "Bagan Archaeological Zone (UNESCO)"],
    neighborhoods: ["Old Bagan", "New Bagan", "Nyaung-U"],
    food: ["Mohinga (catfish noodle soup)", "Shan noodles", "Tea leaf salad (Laphet Thoke)", "Palm sugar toddy", "Burmese curry"],
    activities: ["Hot air balloon ride over 2,000+ ancient temples at sunrise", "Cycling between temples at sunset", "Climbing Bulethi Pagoda for panoramic views", "River cruise on the Irrawaddy"],
    shopping: ["Nyaung-U market for lacquerware", "Local puppet and handicraft shops"],
    culture: ["Ananda Temple murals (12th century)", "Bagan Archaeological Museum", "Traditional lacquerware workshops"]
  },
  "yangon": {
    name: "Yangon", country: "Myanmar", state: "Yangon Region",
    landmarks: ["Shwedagon Pagoda", "Sule Pagoda", "Kandawgyi Lake", "National Museum of Myanmar", "Chaukhtatgyi Buddha Temple", "Botataung Pagoda", "Colonial downtown"],
    neighborhoods: ["Downtown", "Dagon", "Hledan", "Yankin"],
    food: ["Mohinga at roadside stalls", "Tea leaf salad", "Shan noodles", "Street BBQ skewers", "Htamin Jin (Inle rice)", "999 Shan Noodle Shop"],
    activities: ["Sunset prayer ceremony at Shwedagon Pagoda", "Circular train ride around the city", "Exploring colonial downtown architecture", "Boat trip on the Yangon River"],
    shopping: ["Bogyoke Aung San Market (Scott Market)", "Theingyi Zei (Chinatown market)", "Junction City mall"],
    culture: ["Shwedagon Pagoda (Buddhist pilgrimage site)", "National Museum", "Sule Pagoda in city center"]
  },

  // ── MONGOLIA ──
  "ulaanbaatar": {
    name: "Ulaanbaatar", country: "Mongolia", state: "Ulaanbaatar",
    landmarks: ["Gandantegchinlen Monastery", "Sukhbaatar Square", "Bogd Khan Palace Museum", "Zaisan Memorial", "National Museum of Mongolia", "Gandan Monastery", "Winter Palace of Bogd Khan"],
    neighborhoods: ["City Center", "Bayanzurkh", "Khan-Uul", "Ger Districts"],
    food: ["Khorkhog (mutton barbecue)", "Buuz (steamed dumplings)", "Tsuivan (stir-fried noodles)", "Airag (fermented mare's milk)", "Boodog (goat cooked with hot stones)", "Modern Nomads restaurant"],
    activities: ["Staying in a traditional ger (yurt) camp outside the city", "Naadam Festival (July - wrestling, archery, horse racing)", "Terelj National Park day trip", "Gandantegchinlen Monastery morning prayer visit"],
    shopping: ["State Department Store", "Narantuul Market (Black Market)", "Cashmere and wool products at Gobi or Goyo"],
    culture: ["National Museum of Mongolian History", "Zanabazar Fine Arts Museum", "Bogd Khan Winter Palace Museum"]
  },

  // ── PHILIPPINES ──
  "manila": {
    name: "Manila", country: "Philippines", state: "Metro Manila",
    landmarks: ["Intramuros (Walled City)", "Rizal Park (Luneta)", "Manila Cathedral", "Fort Santiago", "San Agustin Church (UNESCO)", "Manila Bay Sunset", "Binondo (Chinatown)", "National Museum of Fine Arts"],
    neighborhoods: ["Intramuros", "Binondo", "Makati", "Bonifacio Global City", "Ermita", "Malate"],
    food: ["Adobo (soy-vinegar stewed meat)", "Sinigang (tamarind soup)", "Lechon (roasted pig)", "Balut (fertilized duck egg)", "Halo-Halo (shaved ice dessert)", "Pancit (noodles)", "Jollibee Chickenjoy", "Binondo street food"],
    activities: ["Sunset cruise along Manila Bay", "Exploring centuries-old Intramuros by kalesa (horse carriage)", "Day trip to Corregidor Island", "Rooftop bar hopping in Bonifacio Global City"],
    shopping: ["Divisoria Market for bargain goods", "SM Mall of Asia (one of world's largest)", "Greenbelt Makati for luxury brands", "Quiapo market for everything"],
    culture: ["San Agustin Church (oldest stone church in Philippines)", "National Museum Complex", "Fort Santiago museum and shrine", "Casa Manila Museum"]
  },
  "cebu city": {
    name: "Cebu City", country: "Philippines", state: "Cebu",
    landmarks: ["Magellan's Cross", "Basilica del Santo Niño", "Fort San Pedro", "Taoist Temple", "Cebu Heritage Monument", "Osmeña Peak"],
    neighborhoods: ["Colon Street", "IT Park", "Lahug", "Uptown Cebu"],
    food: ["Lechon Cebu (best in Philippines)", "Sutokil (sugba-tula-kilaw)", "Puso rice (hanging rice)", "Chorizo de Cebu", "Danggit (dried fish)", "Rico's Lechon restaurant"],
    activities: ["Island hopping to Mactan, Sumilon, Nalusuan", "Whale shark watching in Oslob", "Climbing Osmeña Peak for Chocolate Hills views", "Diving in Moalboal"],
    shopping: ["Colon Street (oldest street in Philippines)", "Ayala Center Cebu", "SM Seaside City", "Carbon Market for local produce"],
    culture: ["Basilica del Santo Niño (oldest church)", "Sinulog Festival (January)", "Magellan's Cross historical site"]
  },
  "boracay": {
    name: "Boracay", country: "Philippines", state: "Aklan",
    landmarks: ["White Beach", "Puka Shell Beach", "Willy's Rock (Grotto)", "Mount Luho viewpoint", "Diniwid Beach", "Bulabog Beach (kitesurfing)"],
    neighborhoods: ["Station 1", "Station 2", "Station 3", "D'Mall area"],
    food: ["Fresh grilled seafood on the beach", "Chori Burger", "Halo-Halo", "Talaba (oysters)", "Jonah's Fruit Shake & Snack Bar", "D'Talipapa seafood market"],
    activities: ["Paraw sailing at sunset", "Cliff diving at Ariel's Point", "Kitesurfing at Bulabog Beach", "ATV ride through the island", "Island hopping to Crystal Cove"],
    shopping: ["D'Mall for souvenirs and clothing", "D'Talipapa market", "Beach vendors for shells and crafts"],
    culture: ["Ati people cultural village visits", "Annual Ati-Atihan Festival influence", "Traditional paraw boat building"]
  },

  // ── POLAND ──
  "krakow": {
    name: "Krakow", country: "Poland", state: "Lesser Poland",
    landmarks: ["Wawel Royal Castle", "Main Market Square (Rynek Główny)", "St. Mary's Basilica", "Wieliczka Salt Mine (UNESCO)", "Auschwitz-Birkenau Memorial (nearby)", "Kazimierz (Jewish Quarter)", "Barbican", "Florian Gate"],
    neighborhoods: ["Old Town", "Kazimierz", "Podgórze", "Nowa Huta", "Zwierzyniec"],
    food: ["Pierogi (dumplings)", "Oscypek (smoked sheep cheese)", "Żurek (sour rye soup)", "Bigos (hunter's stew)", "Polish zapiekanka (open-face sandwich)", "Krakowska sausage", "Pod Wawelem restaurant"],
    activities: ["Exploring Wieliczka Salt Mine UNESCO site", "Visiting Auschwitz-Birkenau memorial", "Dragon's Den (Smocza Jama) cave under Wawel Hill", "Sunset panorama from Wawel Castle", "Kazimierz Jewish Quarter walking tour"],
    shopping: ["Main Market Square stalls for amber jewelry", "Sukiennice (Cloth Hall) for folk crafts", "Kazimierz vintage and antique shops", "Galeria Krakowska mall"],
    culture: ["Wawel Royal Cathedral", "National Museum Krakow", "Oskar Schindler's Factory Museum", "Galicia Jewish Museum in Kazimierz"]
  },
  "warsaw": {
    name: "Warsaw", country: "Poland", state: "Masovian Voivodeship",
    landmarks: ["Warsaw Old Town Market Square (UNESCO)", "Royal Castle", "Palace of Culture and Science", "Wilanów Palace", "Łazienki Park and Palace on the Isle", "Warsaw Rising Museum", "POLIN Museum"],
    neighborhoods: ["Old Town", "Śródmieście", "Praga", "Mokotów", "Żoliborz"],
    food: ["Pierogi Ruskie", "Barszcz (beetroot soup)", "Gołąbki (stuffed cabbage rolls)", "Kotlet schabowy (pork cutlet)", "Polish craft beer", "Zapiekanka from Nowy Świat street"],
    activities: ["Warsaw Rising Museum immersive experience", "Chopin Piano Recital at Łazienki Park (Sunday summers)", "Royal Route walk from Old Town to Wilanów", "Night out in Praga district"],
    shopping: ["Nowy Świat and Chmielna Street boutiques", "Hala Koszyki food market", "Złote Tarasy shopping center", "Hala Mirowska for local food"],
    culture: ["POLIN Museum of the History of Polish Jews", "Warsaw Rising Museum", "National Museum Warsaw", "Fryderyk Chopin Museum"]
  },

  // ── ROMANIA ──
  "bucharest": {
    name: "Bucharest", country: "Romania", state: "Ilfov",
    landmarks: ["Palace of Parliament (2nd largest building in world)", "Old Town (Lipscani)", "Atheneum Concert Hall", "Arc de Triomphe", "Herăstrău Park and Lake", "Village Museum", "Stavropoleos Monastery"],
    neighborhoods: ["Old Town (Lipscani)", "Floreasca", "Dorobanți", "Cotroceni", "Văcărești"],
    food: ["Mămăligă (polenta) with sour cream", "Sarmale (stuffed cabbage rolls)", "Mici (grilled minced meat rolls)", "Ciorbă de burtă (tripe soup)", "Cozonac (sweet bread)", "Casa Doina traditional restaurant"],
    activities: ["Exploring the gargantuan Palace of Parliament", "Craft beer bar-hopping in Lipscani Old Town", "Cycling around Herăstrău Park", "Day trip to Peles Castle in Sinaia"],
    shopping: ["Lipscani Old Town boutiques", "Calea Victoriei for premium brands", "Obor Market for local goods", "AFI Palace shopping mall"],
    culture: ["National Museum of Art of Romania", "Village Museum (open-air)", "Grigore Antipa Natural History Museum", "Athenaeum Concert Hall (classical music)"]
  },
  "transylvania": {
    name: "Transylvania", country: "Romania", state: "Transylvania Region",
    landmarks: ["Bran Castle (Dracula's Castle)", "Peles Castle", "Rasnov Fortress", "Sighisoara Citadel (UNESCO)", "Black Church of Brasov", "Fagaras Fortress"],
    neighborhoods: ["Brasov Old Town", "Sibiu historic center", "Sighisoara medieval citadel"],
    food: ["Kürtőskalács (chimney cake)", "Papricaș (paprika stew)", "Kürtős (Transylvanian pastry)", "Bear garlic soup", "Smoked meats and cheeses"],
    activities: ["Visiting Bran Castle (Dracula legends)", "Hiking in the Bucegi and Fagaras Mountains", "Bear watching in Harghita", "Cycling the Transylvania cycling route"],
    shopping: ["Brasov Old Town craft shops", "Sibiu artisan markets", "Sighisoara medieval fair souvenirs"],
    culture: ["Saxon fortified churches (UNESCO)", "Sighisoara birthplace of Vlad the Impaler", "Astra Open-Air Museum in Sibiu"]
  },

  // ── QATAR ──
  "doha": {
    name: "Doha", country: "Qatar", state: "Ad Dawhah",
    landmarks: ["Museum of Islamic Art", "Souq Waqif", "The Pearl-Qatar island", "Katara Cultural Village", "Corniche Waterfront", "Al Zubarah Fort (UNESCO)", "Education City", "National Museum of Qatar"],
    neighborhoods: ["West Bay (financial district)", "The Pearl", "Msheireb Downtown", "Al Sadd", "Katara"],
    food: ["Machboos (spiced rice with meat)", "Harees (wheat and meat porridge)", "Balaleet (sweet vermicelli)", "Luqaimat (sweet dumplings)", "Camel milk chai", "Souq Waqif food stalls", "Nobu Doha"],
    activities: ["Dhow cruise along the Corniche at sunset", "Desert safari dune bashing", "Visiting Museum of Islamic Art", "Kayaking around The Pearl", "Camel racing at Al Shahaniya"],
    shopping: ["Souq Waqif for traditional goods and spices", "The Pearl luxury brands", "Villagio Mall", "Mall of Qatar"],
    culture: ["Museum of Islamic Art (IM Pei building)", "National Museum of Qatar", "Katara Cultural Village events", "Al Zubarah UNESCO archaeological site"]
  },

  // ── UKRAINE ──
  "kyiv": {
    name: "Kyiv", country: "Ukraine", state: "Kyiv City",
    landmarks: ["Kyiv Pechersk Lavra (Monastery of the Caves, UNESCO)", "Saint Sophia Cathedral (UNESCO)", "Maidan Nezalezhnosti (Independence Square)", "Golden Gate of Kyiv", "Andreivska Church", "Motherland Monument", "Khreschatyk Boulevard"],
    neighborhoods: ["Podil", "Pechersk", "Shevchenkivskyi", "Obolon"],
    food: ["Borscht (beetroot soup)", "Varenyky (dumplings)", "Chicken Kyiv (Kotleta po-Kyivsky)", "Salo (cured pork fat)", "Honey cake (Medivnyk)", "Puzata Hata self-service Ukrainian restaurant"],
    activities: ["Exploring Kyiv Pechersk Lavra cave monasteries", "Sunset views from the Motherland Monument", "Khreschatyk Street Sunday pedestrian boulevard", "Boat tour on the Dnipro River"],
    shopping: ["Bessarabska Market for fresh food", "Andriivskyi Descent (Andriyivsky Uzviz) for arts and crafts", "Gulliver shopping center", "Arena City mall"],
    culture: ["Saint Sophia Cathedral and frescoes", "National Museum of Ukrainian History", "Museum of One Street (Andriyivsky Uzviz)", "Pyrohiv Open-Air Museum"]
  },
  "lviv": {
    name: "Lviv", country: "Ukraine", state: "Lviv Oblast",
    landmarks: ["Lviv Old Town (UNESCO)", "High Castle Hill", "Rynok Square (Market Square)", "Lychakiv Cemetery", "Lviv Opera House", "Dominican Cathedral", "Gunpowder Tower"],
    neighborhoods: ["Old Town", "Lychakiv", "Frankivsk", "Halytskyi"],
    food: ["Lviv coffee culture (born here, supposedly)", "Banosh (cornmeal with cream)", "Syrniki (cottage cheese pancakes)", "Chocolate at Lviv Handmade Chocolate", "Craft beer at local breweries", "Pid Zolotoiu Rozoyu restaurant"],
    activities: ["Coffee tour at Lviv's famous coffee houses", "Lychakiv Cemetery (19th-century sculptural masterpiece)", "High Castle Hill panoramic views", "Lviv Chocolate Workshop experience"],
    shopping: ["Rynok Square artisan stalls", "Handmade chocolate shops", "Lviv Market near the Opera House"],
    culture: ["Lviv Opera and Ballet Theatre", "Lviv History Museum", "Church of the Transfiguration", "Armenian Cathedral"]
  },

  // ── URUGUAY ──
  "montevideo": {
    name: "Montevideo", country: "Uruguay", state: "Montevideo Department",
    landmarks: ["Ciudad Vieja (Old City)", "Rambla (coastal promenade)", "Mercado del Puerto", "Teatro Solís", "Palacio Salvo", "Cerro de Montevideo fortress", "Prado Park"],
    neighborhoods: ["Ciudad Vieja", "Centro", "Pocitos", "Punta Carretas", "Palermo"],
    food: ["Asado (Argentine-Uruguayan BBQ)", "Chivito (steak sandwich)", "Mate (herbal drink)", "Milanesa a la napolitana", "Alfajores", "Mercado del Puerto parrillas (steakhouses)"],
    activities: ["Sunday Tristán Narvaja flea market", "Sunset walk along the Rambla (22km coastal promenade)", "Mercado del Puerto steakhouse lunch", "Day trip to Colonia del Sacramento"],
    shopping: ["Punta Carretas Shopping (converted prison)", "Tristán Narvaja Sunday market", "Old City antique shops", "Mercado Ferrando"],
    culture: ["Museo Nacional de Artes Visuales", "Teatro Solís (1856 opera house)", "Carnaval Museum (Uruguay has longest Carnival in the world)", "Museo del Gaucho"]
  },

  // ── UZBEKISTAN ──
  "samarkand": {
    name: "Samarkand", country: "Uzbekistan", state: "Samarkand Region",
    landmarks: ["Registan Square (UNESCO)", "Shah-i-Zinda necropolis", "Bibi-Khanym Mosque", "Gur-e-Amir Mausoleum (Tamerlane's tomb)", "Siyob Bazaar", "Ulugh Beg Observatory", "Afrasiyab Museum"],
    neighborhoods: ["Registan area", "Old City", "New City"],
    food: ["Plov (Uzbek pilaf, UNESCO heritage)", "Samsa (baked meat pastry)", "Shashlik (grilled skewers)", "Lagman (hand-pulled noodles)", "Non (tandoor bread)", "Chak-Chak (honey pastry)", "Central Asian dried fruits from Siyob Bazaar"],
    activities: ["Sunset at Registan Square (three magnificent madrasahs)", "Shah-i-Zinda sacred alley of mausoleums", "Siyob Bazaar morning spice and silk shopping", "Gur-e-Amir Tamerlane's Mausoleum tour"],
    shopping: ["Siyob Bazaar for spices, silk, dried fruits", "Registan area for Suzani embroidery", "Craft workshops near the old city"],
    culture: ["Registan (crown of Silk Road architecture)", "Bibi-Khanym Mosque ruins", "Afrasiyab Museum (ancient Sogdian murals)", "Ulugh Beg Observatory (15th century)"]
  },
  "bukhara": {
    name: "Bukhara", country: "Uzbekistan", state: "Bukhara Region",
    landmarks: ["Ark Fortress", "Poi Kalon Mosque and Minaret", "Kalon Minaret", "Lyabi-Hauz pool complex", "Samanid Mausoleum", "Chor Minor mosque", "Magoki-Attori Mosque"],
    neighborhoods: ["Old City (UNESCO World Heritage Site)", "Lyabi-Hauz area"],
    food: ["Plov", "Shashlik", "Samsa", "Bukharan manti (steamed dumplings)", "Qurutob (bread with yogurt sauce)", "Lyabi-Hauz teahouse breakfasts"],
    activities: ["Lyabi-Hauz evening performances", "Exploring 1,000-year-old Ark Fortress", "Silk weaving workshops", "Camel ride in nearby desert"],
    shopping: ["Toqi-Sarrofon bazaar for money changers (historic)", "Telpak Furushon market for hats", "Silk and Spice Festival (May)"],
    culture: ["Kalon Mosque and Minaret (850-year-old minaret)", "Samanid Mausoleum (10th century)", "Museum of History of Bukhara"]
  },
  "tashkent": {
    name: "Tashkent", country: "Uzbekistan", state: "Tashkent Region",
    landmarks: ["Khast Imam Square (Hazrati Imam)", "Kukeldash Madrasa", "Chorsu Bazaar", "Tashkent Metro (Soviet mosaics)", "Amir Timur Square", "Independence Square", "Museum of Timurids"],
    neighborhoods: ["Old Town", "Yunusabad", "Mirabad", "Chilanzar"],
    food: ["Plov at Besh Qozon restaurant (Central Asian speciality)", "Non bread", "Somsa", "Shashlik", "Dimlama (meat and vegetable stew)", "Chorsu Bazaar street food"],
    activities: ["Tashkent Metro station art tour (each station unique)", "Chorsu Bazaar shopping experience", "Khast Imam Islamic complex visit", "Navoi Opera and Ballet Theatre show"],
    shopping: ["Chorsu Bazaar for spices, nuts, dried fruits", "TSUM Department Store", "Silk Road Bazaar"],
    culture: ["Museum of Timurids", "State Museum of History of Uzbekistan", "Navoi Opera and Ballet Theatre", "Applied Arts Museum"]
  },

  // ── VENEZUELA ──
  "caracas": {
    name: "Caracas", country: "Venezuela", state: "Capital District",
    landmarks: ["Plaza Bolívar", "National Pantheon", "Central University City (UNESCO)", "El Ávila National Park (Warairarepano)", "Teresa Carreño Cultural Complex", "Caracas Cathedral"],
    neighborhoods: ["El Hatillo", "Chacao", "Altamira", "Las Mercedes", "La Candelaria"],
    food: ["Arepas (cornmeal pockets)", "Pabellón Criollo (national dish)", "Cachapas (sweet corn pancakes)", "Hallacas (Christmas tamales)", "Tequeños (cheese sticks)", "Tizana (tropical fruit punch)"],
    activities: ["Cable car ride up El Ávila Mountain", "Day trip to Los Roques archipelago", "Salsa dancing at Las Mercedes clubs", "Museum of Contemporary Art visit"],
    shopping: ["Centro Sambil mall", "El Hatillo colonial village shops", "Las Mercedes for boutiques"],
    culture: ["Central University City murals (UNESCO)", "Museo de Arte Contemporáneo de Caracas", "Teresa Carreño Cultural Complex", "National Pantheon"]
  },

  // ── YEMEN ──
  "sanaa": {
    name: "Sanaa", country: "Yemen", state: "Sanaa Governorate",
    landmarks: ["Old City of Sanaa (UNESCO)", "Great Mosque of Sanaa", "Al-Saleh Mosque", "Bab al-Yemen (Gate of Yemen)", "Al-Madhbah market", "National Museum of Yemen"],
    neighborhoods: ["Old Sanaa (Medina)", "Hayel Street area", "New City"],
    food: ["Fahsa (lamb stew in stone pot)", "Saltah (national dish)", "Bint al-Sahn (honey cake)", "Aseed (dough with honey)", "Qishr (ginger coffee)", "Mandi (slow-cooked lamb)"],
    activities: ["Exploring the medieval tower-houses of Old Sanaa", "Old City market souks walk", "Day trip to Thula fortified village"],
    shopping: ["Al-Madhbah silver market", "Suq al-Milh salt market", "Bab al-Yemen area souks"],
    culture: ["Old City of Sanaa (UNESCO - 2,500-year-old city)", "National Museum of Yemen", "Great Mosque of Sanaa"]
  },

  // ── ZAMBIA ──
  "lusaka": {
    name: "Lusaka", country: "Zambia", state: "Lusaka Province",
    landmarks: ["Victoria Falls (nearby, shared with Zimbabwe)", "Lusaka National Museum", "Munda Wanga Environmental Park", "Freedom Statue", "Cathedral of the Holy Cross"],
    neighborhoods: ["Cairo Road", "Kabulonga", "Woodlands", "Olympia"],
    food: ["Nshima (maize porridge)", "Ifisashi (peanut greens)", "Kapenta (dried fish)", "Chikanda (wild orchid pudding)", "Braai (grilled meats)"],
    activities: ["Day trip to Lower Zambezi National Park", "Visit Kabwata Cultural Village", "Chirundu border market experience"],
    shopping: ["Soweto Market", "Arcades Shopping Centre", "Manda Hill Mall"],
    culture: ["National Museum of Zambia", "Kabwata Cultural Village", "Lusaka Playhouse Theatre"]
  },

  // ── ZIMBABWE ──
  "harare": {
    name: "Harare", country: "Zimbabwe", state: "Harare Province",
    landmarks: ["National Gallery of Zimbabwe", "Harare Gardens", "Mukuvisi Woodlands", "Chapungu Sculpture Park", "Heroes Acre monument"],
    neighborhoods: ["CBD", "Avondale", "Borrowdale", "Msasa"],
    food: ["Sadza (maize meal)", "Nyama (grilled meats)", "Matemba (dried kapenta fish)", "Muriwo nehuku (chicken with greens)", "Bota (porridge)"],
    activities: ["Chapungu Sculpture Park (Shona stone sculptures)", "Botanical Gardens walk", "Day trip to Matobo Hills National Park"],
    shopping: ["Avondale Flea Market", "Doon Estate Craft Village", "Sam Levy's Village"],
    culture: ["National Gallery of Zimbabwe", "Zimbabwe Museum of Human Sciences", "Mbare Musika market cultural experience"]
  },
  "victoria falls": {
    name: "Victoria Falls", country: "Zimbabwe", state: "Matabeleland North",
    landmarks: ["Victoria Falls (UNESCO, one of 7 Natural Wonders)", "Devil's Pool", "Knife Edge Bridge", "Livingstone Island", "Big Tree (baobab)", "Victoria Falls Bridge"],
    neighborhoods: ["Victoria Falls Town", "Livingstone (Zambia side)"],
    food: ["Bush dinner under African stars", "Bream fish from the Zambezi", "Traditional braai", "Elephant Pepper Camp dining"],
    activities: ["Bungee jumping off Victoria Falls Bridge (111m)", "White water rafting Grade 5 rapids", "Helicopter 'Flight of Angels'", "Swimming at Devil's Pool (edge of the falls)", "Sunset Zambezi cruise", "Safari at Chobe National Park (nearby)"],
    shopping: ["Victoria Falls Curio Market", "Elephant's Walk shopping complex"],
    culture: ["Makuni Village cultural experience", "Craft village demonstrations"]
  },

  // ── UGANDA ──
  "kampala": {
    name: "Kampala", country: "Uganda", state: "Central Region",
    landmarks: ["Kasubi Tombs (UNESCO)", "Gaddafi National Mosque", "Uganda Museum", "Namirembe Cathedral", "Rubaga Cathedral", "Source of the Nile (Jinja, nearby)"],
    neighborhoods: ["Kololo", "Nakasero", "Kawempe", "Old Kampala"],
    food: ["Rolex (rolled egg omelette in chapati)", "Matoke (steamed bananas)", "Groundnut stew", "Posho and beans", "Tilapia from Lake Victoria", "Nandos Kampala"],
    activities: ["White-water rafting at Source of the Nile in Jinja", "Gorilla trekking in Bwindi Impenetrable Forest (nearby)", "Kasubi Royal Tombs UNESCO site visit", "Kampala city boda-boda (motorcycle taxi) tour"],
    shopping: ["Owino Market (St. Balikuddembe Market)", "Garden City Mall", "Craft Market on Buganda Road"],
    culture: ["Kasubi Tombs (burial grounds of Buganda Kings)", "Uganda Museum", "Ndere Cultural Centre performances"]
  },

  // ── TRINIDAD AND TOBAGO ──
  "port of spain": {
    name: "Port of Spain", country: "Trinidad and Tobago", state: "Port of Spain",
    landmarks: ["Queen's Park Savannah", "National Museum and Art Gallery", "Emperor Valley Zoo", "Magnificent Seven mansions", "Red House Parliament", "Fort George viewpoint"],
    neighborhoods: ["Woodbrook", "St. Clair", "Maraval", "Newtown"],
    food: ["Doubles (curried chickpeas in bara bread)", "Bake and Shark (Maracas Beach)", "Pelau (rice, pigeon peas, meat)", "Callaloo (dasheen leaves stew)", "Roti", "Solo drinks", "Richard's Bake and Shark"],
    activities: ["Trinidad Carnival (world's greatest - February)", "Birdwatching at Asa Wright Nature Centre", "Maracas Beach day trip", "Steel pan music yard experience"],
    shopping: ["Long Circular Mall", "Gulf City Mall", "St. James Market", "Cruise Ship Complex duty-free"],
    culture: ["Carnival (world's most spectacular)", "Steel pan music (invented in Trinidad)", "Naipaul's birthplace heritage", "National Museum and Art Gallery"]
  },

  // ── TONGA ──
  "nukualofa": {
    name: "Nukuʻalofa", country: "Tonga", state: "Tongatapu",
    landmarks: ["Royal Palace", "Langi (ancient royal tombs)", "Oholei Beach", "Mapu'a 'a Vaea Blowholes", "Ha'amonga 'a Maui trilithon", "Tongatapu island"],
    neighborhoods: ["Central Nuku'alofa", "Sopu", "Kolomotu'a"],
    food: ["Lu pulu (meat and coconut cream in taro leaves)", "Ota 'ika (raw fish salad)", "Keke (Tongan doughnuts)", "Ufi (yam dishes)", "Fresh coconut drinks", "Heilala vanilla products"],
    activities: ["Witnessing ancient royal tombs (Langi)", "Snorkeling at pristine coral reefs", "Ha'amonga 'a Maui trilithon (Stonehenge of the Pacific)", "Whale watching (July-October)", "Traditional kava ceremony"],
    shopping: ["Talamahu Market for handicrafts", "Local tapa cloth weavings"],
    culture: ["Ha'amonga 'a Maui (ancient royal gateway)", "Royal Palace (only royal palace in Polynesia)", "Traditional kava ceremony culture"]
  },

  // ── MALTA ──
  "valletta": {
    name: "Valletta", country: "Malta", state: "South Eastern Region",
    landmarks: ["St. John's Co-Cathedral", "Grand Harbour", "Upper Barrakka Gardens", "Fort St. Elmo", "Grandmaster's Palace", "Valletta Waterfront", "Three Cities (Vittoriosa, Senglea, Cospicua)"],
    neighborhoods: ["Valletta City Centre", "Floriana", "Sliema", "St. Julian's"],
    food: ["Pastizzi (flaky pastry with ricotta or peas)", "Rabbit stew (Stuffat tal-Fenek)", "Ftira (local bread sandwich)", "Imqarrun (baked pasta)", "Kinnie (bitter orange soft drink)", "Ħobż biż-Żejt (bread with tomato paste)", "Rubino restaurant (Valletta institution)"],
    activities: ["Grand Harbour cruise at sunset", "Blue Grotto boat trip", "Exploring Mdina (Silent City) fortified town", "Hypogeum of Ħal Saflieni UNESCO underground temple", "Snorkeling in Blue Lagoon (Comino)"],
    shopping: ["Merchant Street for local boutiques", "Republic Street souvenir shops", "Marsaxlokk Sunday fish market", "Crafts Village at Ta' Qali"],
    culture: ["St. John's Co-Cathedral (gold leaf baroque interior)", "Grandmaster's Palace State Rooms", "Malta National Museum of Archaeology", "Valletta (2018 European Capital of Culture)"]
  },
  "mdina": {
    name: "Mdina", country: "Malta", state: "Western District",
    landmarks: ["Mdina Cathedral", "Mdina Gate", "Palazzo Falson Historic House Museum", "Bastion Square", "Mdina Ditch Gardens"],
    neighborhoods: ["Mdina walled city", "Rabat (suburb)"],
    food: ["Pastizzi from local shops", "Honey rings (Qaghaq tal-ghasel)", "Mdina Glass cafe"],
    activities: ["Walking the silent medieval streets at dawn", "Sunset views from the bastions", "Catacombs of St. Paul in adjacent Rabat"],
    shopping: ["Mdina Glass workshop", "Lace and filigree craft shops"],
    culture: ["Mdina Cathedral Museum", "Natural History Museum in adjacent Rabat", "Palazzo Falson medieval palace"]
  },

  // ── MAURITIUS ──
  "port louis": {
    name: "Port Louis", country: "Mauritius", state: "Port Louis District",
    landmarks: ["Le Caudan Waterfront", "Central Market", "Aapravasi Ghat (UNESCO)", "Fort Adelaide (Citadel)", "Blue Penny Museum", "Champ de Mars Racecourse"],
    neighborhoods: ["Port Louis City Centre", "Chinatown", "Plaine Verte", "Caudan"],
    food: ["Dholl puri (flatbread with lentils)", "Gateau piment (chilli cakes)", "Mine frite (fried noodles)", "Rougaille (Creole tomato stew)", "Alouda (rosewater milk drink)", "Biryani at central market stalls"],
    activities: ["Le Pétrin Nature Reserve day trip", "Snorkeling at Blue Bay Marine Park", "Chamarel Seven Coloured Earths visit", "Le Morne Brabant (UNESCO) hike"],
    shopping: ["Le Caudan Waterfront Mall", "Central Market for spices and crafts", "Sunset Boulevard shopping"],
    culture: ["Aapravasi Ghat (immigration depot UNESCO)", "Blue Penny Museum (rare stamps)", "Natural History Museum", "Eurekha Heritage House"]
  },

  // ── MOLDOVA ──
  "chisinau": {
    name: "Chișinău", country: "Moldova", state: "Chișinău Municipality",
    landmarks: ["Stefan cel Mare Central Park", "Nativity Cathedral", "Triumphal Arch", "National Museum of History", "Valea Morilor Park and Lake", "Pushkin Museum"],
    neighborhoods: ["City Center", "Botanica", "Ciocana", "Buiucani"],
    food: ["Mămăligă (cornmeal)", "Placinte (stuffed pastry)", "Zeama (chicken noodle soup)", "Moldovan wine (world's largest wine cellar at Mileștii Mici)", "Sarmale (stuffed cabbage)", "La Taifas restaurant"],
    activities: ["Wine tasting at Cricova or Mileștii Mici underground cellars", "Stefan cel Mare Park weekend walk", "Day trip to Orheiul Vechi cave monastery"],
    shopping: ["Piaţa Centrală (Central Market)", "Malldova shopping center", "Jumbo hypermarket"],
    culture: ["National Museum of History of Moldova", "National Museum of Fine Arts", "Orheiul Vechi open-air monastery complex (nearby)"]
  },

  // ── MONACO ──
  "monaco": {
    name: "Monaco", country: "Monaco", state: "Monaco",
    landmarks: ["Monte Carlo Casino", "Prince's Palace of Monaco", "Monaco Cathedral", "Oceanographic Museum", "Larvotto Beach", "Monaco Grand Prix circuit", "Exotic Garden of Monaco"],
    neighborhoods: ["Monte Carlo", "La Condamine", "Monaco-Ville (The Rock)", "Fontvieille", "Larvotto"],
    food: ["Barbagiuan (fried cheese pastry)", "Socca (chickpea pancake)", "Fresh Mediterranean seafood", "Niçoise-style dishes", "Louis XV at Hotel de Paris (Alain Ducasse)", "Beefbar Monaco"],
    activities: ["Monaco Grand Prix (May, world's most glamorous race)", "Monte Carlo Casino visit (jacket required)", "Yacht-watching at La Condamine harbour", "Oceanographic Museum aquarium", "Hiking the coastal Tête de Chien ridge"],
    shopping: ["Monte Carlo luxury boutiques (Hermès, Louis Vuitton, Chanel)", "Galerie du Metropole", "Formula One memorabilia shops", "Carrefour Monaco for daily goods"],
    culture: ["Oceanographic Museum (founded by Prince Albert I)", "Nouveau Musée National de Monaco", "Monaco Cathedral (burial place of Princess Grace)", "Prince's Palace Changing of the Guard (11:55am daily)"]
  },

  // ── MONTENEGRO ──
  "kotor": {
    name: "Kotor", country: "Montenegro", state: "Kotor Municipality",
    landmarks: ["Old Town of Kotor (UNESCO)", "Kotor City Walls", "Cathedral of Saint Tryphon", "San Giovanni Fortress", "Bay of Kotor", "Škurda River canyon"],
    neighborhoods: ["Old Town", "Dobrota", "Prčanj"],
    food: ["Kotor black risotto", "Njegoš cheese", "Smoked ham (Njeguški pršut)", "Fresh Adriatic seafood", "Grilled squid", "Konoba Scala Santa restaurant"],
    activities: ["Hiking 1,355 steps up to San Giovanni Fortress for bay views", "Kayaking in the Bay of Kotor (Europe's southernmost fjord)", "Day trip to Perast and Our Lady of the Rocks island church", "Swimming at Plaže beaches"],
    shopping: ["Old Town souvenir shops", "Local olive oil and wine", "Promenade waterfront shops"],
    culture: ["Cathedral of Saint Tryphon (12th century)", "Maritime Museum of Montenegro", "Our Lady of the Rocks island church (legend-filled)"]
  },
  "podgorica": {
    name: "Podgorica", country: "Montenegro", state: "Podgorica Municipality",
    landmarks: ["Millennium Bridge", "Old Town (Stara Varoš)", "Petrović Palace", "Natural History Museum", "Cathedral of the Resurrection of Christ", "Skadar Lake (nearby)"],
    neighborhoods: ["Stara Varoš (Old Town)", "City Kvart", "Zabjelo"],
    food: ["Ćevapi (grilled minced meat)", "Priganice (doughnuts with honey)", "Kačamak (maize and cheese dish)", "Fresh lamb dishes", "Local Plantaže wine", "Riverside fish restaurants"],
    activities: ["Day trip to Skadar Lake (largest lake in southern Europe)", "Niagara Waterfalls near Podgorica hike", "Ostrog Monastery cliff visit", "Rijeka Crnojevića kayaking"],
    shopping: ["Delta City Mall", "Mall of Montenegro", "Old Town crafts"],
    culture: ["Museum of Montenegro", "Gallery of Arts Podgorica", "Ottoman Clock Tower in Old Town"]
  },

  // ── NORWAY ──
  "bergen": {
    name: "Bergen", country: "Norway", state: "Vestland",
    landmarks: ["Bryggen Wharf (UNESCO)", "Fløibanen Funicular to Mount Fløyen", "Bergenhus Fortress", "Edvard Grieg's Troldhaugen", "KODE Art Museums", "Fish Market (Fisketorget)", "Rosenkrantz Tower"],
    neighborhoods: ["Bryggen", "Nordnes", "Sandviken", "Fløen"],
    food: ["Fresh Bergen fish soup", "Raspeballer (potato dumplings)", "Fiskekaker (fish cakes)", "King crab", "Pinnekjøtt (dried lamb ribs)", "Enhjørningen restaurant at Bryggen", "Fisketorget fresh market"],
    activities: ["Fjord cruise from Bergen (gateway to Norwegian Fjords)", "Fløibanen funicular for panoramic city views", "Hiking on Mount Ulriken", "Edvard Grieg museum and concerts at Troldhaugen"],
    shopping: ["Bryggen Wharf craft and souvenir shops", "Fisketorget market", "Galleriet shopping center", "Kløverhuset mall"],
    culture: ["Bryggen Hanseatic Quarter (UNESCO)", "KODE Art Museum (largest in Scandinavia)", "Bergenhus Medieval Fortress", "Theta Museum (secret WWII resistance)"]
  },
  "oslo": {
    name: "Oslo", country: "Norway", state: "Oslo",
    landmarks: ["Viking Ship Museum", "Oslo Opera House", "Vigeland Sculpture Park", "Akershus Fortress", "The National Gallery (The Scream)", "Holmenkollen Ski Jump", "Aker Brygge waterfront"],
    neighborhoods: ["Aker Brygge", "Grünerløkka", "Frogner", "Majorstuen", "Tjuvholmen"],
    food: ["Rakfisk (fermented fish)", "Fårikål (lamb and cabbage stew)", "Kjøttkaker (meatballs)", "Brunost (brown cheese)", "Open-face shrimp sandwich", "Maaemo (3-Michelin-star restaurant)", "Mathallen Oslo food hall"],
    activities: ["Vigeland Sculpture Park (200+ sculptures, free entry)", "Oslo Opera House rooftop walk", "Fjord kayaking around the Oslofjord", "Holmenkollen Ski Jump museum and simulator"],
    shopping: ["Grünerløkka vintage and boutique shops", "Aker Brygge waterfront shops", "Mathallen Oslo", "Karl Johans Gate main street"],
    culture: ["Munch Museum (The Scream and Edvard Munch works)", "Viking Ship Museum", "Norwegian National Museum", "Astrup Fearnley Museum of Modern Art"]
  },

  // ── OMAN ──
  "muscat": {
    name: "Muscat", country: "Oman", state: "Muscat Governorate",
    landmarks: ["Sultan Qaboos Grand Mosque", "Muttrah Souq", "Al Jalali and Al Mirani Forts", "Royal Opera House Muscat", "Corniche Waterfront", "Bait Al Zubair Museum", "National Museum of Oman"],
    neighborhoods: ["Muttrah", "Old Muscat", "Qurum", "Ruwi", "Madinat Sultan Qaboos"],
    food: ["Shuwa (slow-cooked lamb in underground oven)", "Mashuai (kingfish with lime rice)", "Halwa (Omani sweet)", "Kahwa (cardamom coffee with dates)", "Muttrah Souq street food", "Bait Al Luban restaurant"],
    activities: ["Sultan Qaboos Grand Mosque early morning visit (open to non-Muslims)", "Muttrah Souq evening shopping and spice hunting", "Wadi Shab canyon hike and swim (nearby)", "Royal Opera House performance", "Whale and dolphin watching boat trip"],
    shopping: ["Muttrah Souq for silver, frankincense, and khanjar daggers", "Oman Avenues Mall", "Qurum City Centre", "Mutrah Fish Market morning"],
    culture: ["Sultan Qaboos Grand Mosque (6th largest in world)", "Royal Opera House Muscat", "National Museum of Oman", "Bait Al Zubair folk art museum"]
  },

  // ── NIGERIA ──
  "lagos": {
    name: "Lagos", country: "Nigeria", state: "Lagos State",
    landmarks: ["Lekki Conservation Centre", "National Museum Lagos", "Terra Kulture", "Nike Art Gallery", "Lagos Island", "Bar Beach (Eko Atlantic)", "Freedom Park"],
    neighborhoods: ["Lagos Island (Eko)", "Victoria Island", "Lekki", "Ikeja", "Surulere", "Yaba"],
    food: ["Jollof rice (Nigeria vs Ghana debate)", "Suya (spiced grilled beef)", "Egusi soup with pounded yam", "Akara (bean fritters)", "Pepper soup", "Buka stalls (local restaurants)", "Yellow Chilli restaurant"],
    activities: ["Nike Art Gallery (four floors of Nigerian art)", "Lekki Conservation Centre canopy walkway", "Victoria Island beach clubs", "Afrobeats live music at Quilox or Hard Rock"],
    shopping: ["Computer Village Ikeja (electronics)", "Balogun Market (Lagos Island)", "The Palms Shopping Mall Lekki", "Freedom Park market events"],
    culture: ["National Museum Lagos (Benin Bronzes collection)", "Terra Kulture arts centre", "MUSON Centre (Music Society of Nigeria)", "Badagry slave history sites (nearby)"]
  },
  "abuja": {
    name: "Abuja", country: "Nigeria", state: "Federal Capital Territory",
    landmarks: ["Aso Rock", "Nigerian National Mosque", "National Christian Centre", "Zuma Rock", "Millennium Park", "National Museum Abuja", "Three Arms Zone"],
    neighborhoods: ["Central Business District", "Wuse", "Garki", "Maitama", "Gwarinpa"],
    food: ["Pepper soup", "Suya at Abuja's Suya spots", "Tuwo shinkafa (rice pudding)", "Kilishi (dried spiced beef)", "Nkwobi (cow leg spiced dish)", "Churrasco restaurant Maitama"],
    activities: ["Aso Rock climbing (with guide)", "Millennium Park jogging and picnics", "Abuja Arts and Crafts Village", "Gurara Falls day trip"],
    shopping: ["Utako Market", "Ceddi Plaza", "Jabi Lake Mall", "Wuse Market"],
    culture: ["National Mosque and National Christian Centre side by side", "Abuja National Museum", "Arts and Crafts Village"]
  },

  // ── PERU ──
  "cusco": {
    name: "Cusco", country: "Peru", state: "Cusco Region",
    landmarks: ["Machu Picchu (UNESCO, nearby)", "Plaza de Armas", "Sacsayhuamán Inca fortress", "Qorikancha (Temple of the Sun)", "San Pedro Market", "Cusco Cathedral", "Pisac ruins", "Rainbow Mountain (Vinicunca)"],
    neighborhoods: ["Historic Center (UNESCO)", "San Blas artisan quarter", "Miraflores", "San Pedro"],
    food: ["Cuy (roasted guinea pig)", "Lomo saltado (stir-fried beef)", "Causa rellena (layered potato dish)", "Ceviche", "Chicha morada (purple corn drink)", "Pisco Sour (national cocktail)", "Chicha de jora (fermented corn beer)", "Cicciolina restaurant"],
    activities: ["Inca Trail trek to Machu Picchu", "Rainbow Mountain (Vinicunca) hike", "Sacred Valley tour (Pisac, Ollantaytambo, Moray)", "Cooking class learning Peruvian cuisine", "San Pedro Market morning visit"],
    shopping: ["San Pedro Market for textiles and food", "San Blas artisan quarter for handicrafts", "Pisac Market (Sunday) for alpaca goods"],
    culture: ["Qorikancha Temple (Inca Temple of the Sun beneath a Spanish convent)", "Cusco Cathedral on Plaza de Armas", "Museum of Pre-Columbian Art", "Inti Raymi Festival (June 24)"]
  },
  "lima": {
    name: "Lima", country: "Peru", state: "Lima Region",
    landmarks: ["Historic Centre of Lima (UNESCO)", "Plaza Mayor (Plaza de Armas)", "Huaca Pucllana pyramid", "Larco Museum", "Miraflores Parque del Amor", "Magic Water Circuit (El Circuito Mágico del Agua)", "Barranco neighborhood"],
    neighborhoods: ["Miraflores", "Barranco", "San Isidro", "Historic Centre", "Surco"],
    food: ["Ceviche (fresh raw fish in citrus)", "Lomo saltado", "Causa rellena", "Anticuchos (grilled beef heart skewers)", "Picarones (squash doughnuts)", "Central restaurant (world's best restaurant)", "La Mar Cevichería"],
    activities: ["Paragliding over Pacific Ocean from Miraflores cliffs", "Larco Museum pre-Columbian treasures", "Huaca Pucllana pyramid ruins in the city", "Magic Water Circuit sound-and-light show at night"],
    shopping: ["Mercado Indio for handicrafts (Miraflores)", "Jockey Plaza mall", "Larcomar waterfront shopping center", "Barranco antique shops and art galleries"],
    culture: ["Larco Museum (6,000 years of pre-Columbian art)", "MALI (Museo de Arte de Lima)", "Historic Centre Lima (UNESCO)", "Gastón Acurio culinary revolution"]
  },

  // ── PANAMA ──
  "panama city": {
    name: "Panama City", country: "Panama", state: "Panama Province",
    landmarks: ["Panama Canal (Miraflores Locks)", "Casco Viejo (UNESCO)", "Biodiversity Museum (Biomuseo)", "Ancon Hill", "Metropolitan Natural Park", "Panama Viejo ruins (UNESCO)", "Causeway Islands"],
    neighborhoods: ["Casco Viejo (San Felipe)", "Miraflores", "El Cangrejo", "Punta Pacífica", "San Francisco"],
    food: ["Sancocho (chicken soup)", "Ceviche panameño", "Ropa vieja (shredded beef)", "Patacones (fried plantain)", "Carimanolas (yuca fritters)", "Mercado de Mariscos fresh seafood"],
    activities: ["Watching massive ships transit Panama Canal at Miraflores Locks", "Casco Viejo historic district walking tour", "Panama Canal boat tour from Gamboa", "Day trip to San Blas Islands (Kuna Yala)"],
    shopping: ["Multicentro Mall", "Multiplaza Pacific", "Albrook Mall (largest in Central America)", "Casco Viejo boutiques"],
    culture: ["Biomuseo (Frank Gehry-designed biodiversity museum)", "Casco Viejo (UNESCO colonial district)", "Panama Canal Museum", "Miraflores Visitors Center and Museum"]
  },

  // ── PAKISTAN ──
  "lahore": {
    name: "Lahore", country: "Pakistan", state: "Punjab",
    landmarks: ["Lahore Fort (UNESCO Shahi Qila)", "Badshahi Mosque", "Shalimar Gardens (UNESCO)", "Walled City of Lahore", "Wagah Border", "Lahore Museum", "Data Darbar shrine", "Minar-e-Pakistan"],
    neighborhoods: ["Old Walled City", "Gulberg", "Model Town", "DHA", "Anarkali Bazaar area"],
    food: ["Lahori Chargha (whole roasted chicken)", "Nihari (slow-cooked beef stew)", "Paya (trotters soup)", "Lassi (yogurt drink)", "Lahori fish fry", "Phajja's Paye in Old City", "Gawalmandi Food Street"],
    activities: ["Wagah Border flag-lowering ceremony at sunset", "Lahore Fort and Sheesh Mahal (Mirror Palace) tour", "Old City food walk on Gawalmandi Food Street", "Badshahi Mosque rooftop view at sunset"],
    shopping: ["Anarkali Bazaar for fabrics and jewelry", "Liberty Market for clothes", "Hafeez Centre for electronics", "Hafiz Jalandhari Market"],
    culture: ["Lahore Fort (Mughal imperial complex)", "Badshahi Mosque (one of world's largest)", "Shalimar Gardens (Mughal paradise garden)", "Lahore Museum (world's richest Gandhara collection)"]
  },
  "islamabad": {
    name: "Islamabad", country: "Pakistan", state: "Islamabad Capital Territory",
    landmarks: ["Faisal Mosque (4th largest in world)", "Margalla Hills National Park", "Shakarparian Hills", "Lok Virsa Museum", "Pakistan Monument", "Daman-e-Koh viewpoint"],
    neighborhoods: ["Blue Area (F-7)", "E-7 (Islamabad)", "G-6", "F-6 (Super Market)", "Kohsar Market area"],
    food: ["Karahi (wok-cooked meat)", "BBQ at Melody Food Park", "Kashmiri pink chai", "Biryani", "Pakora with chutney", "Monal Restaurant (with Margalla Hills view)"],
    activities: ["Hiking Margalla Hills Trail 3, 4, and 5", "Monal restaurant sunset dinner with mountain views", "Pakistan Monument and Museum visit", "Day trip to Taxila UNESCO archaeological site"],
    shopping: ["Centaurus Mall", "Giga Mall", "F-7 Jinnah Super Market", "Lok Virsa craft bazaar"],
    culture: ["Faisal Mosque (modern Islamic architecture masterpiece)", "Lok Virsa Museum of folk and traditional heritage", "Pakistan Monument and National Heritage Museum", "Taxila UNESCO site (nearby)"]
  },

  // ── MALDIVES ──
  "malé": {
    name: "Malé", country: "Maldives", state: "Kaafu Atoll",
    landmarks: ["Hukuru Miskiy (Friday Mosque, 1656)", "National Museum of Maldives", "Maldives Victory Monument", "Artificial Beach", "Sultan Park", "Fish Market"],
    neighborhoods: ["Malé City Centre", "Hulhumalé (reclaimed island)", "Maafannu"],
    food: ["Garudhiya (fish broth soup)", "Mas huni (tuna and coconut breakfast)", "Rihaakuru (fish paste)", "Short eats (hedhikaa) at tea shops", "Masroshi (stuffed tuna pastry)", "Fresh tuna sashimi"],
    activities: ["Snorkeling and diving at nearby atolls", "Sunset dhoni (traditional boat) cruise", "Day trip to Maafushi or Hulhumale beaches", "Whale shark watching at South Ari Atoll"],
    shopping: ["Local Market (fish and produce)", "STO Trading Centre", "Maldives souvenir shops on Chaandhanee Magu"],
    culture: ["Hukuru Miskiy (oldest mosque with coral stone carvings)", "National Museum (Maldivian history and pre-Islamic artifacts)", "Traditional bodu beru drumming performances"]
  },

  // ── RWANDA ──
  "kigali": {
    name: "Kigali", country: "Rwanda", state: "Kigali Province",
    landmarks: ["Kigali Genocide Memorial", "Kimironko Market", "Inema Arts Center", "Gisozi Genocide Memorial", "Presidential Palace Museum", "Nyamirambo neighborhood"],
    neighborhoods: ["Kiyovu", "Nyamirambo", "Kimironko", "Remera", "Gisozi"],
    food: ["Ugali (maize porridge)", "Brochettes (grilled meat skewers)", "Mizuzu (fried plantain)", "Isombe (cassava leaves)", "Urwagwa (banana beer)", "Heaven Restaurant rooftop Kigali"],
    activities: ["Kigali Genocide Memorial (sobering, essential visit)", "Gorilla trekking in Volcanoes National Park", "Nyungwe Forest chimpanzee tracking", "Canopy walk at Nyungwe Forest", "Inema Arts Center community visit"],
    shopping: ["Kimironko Market for crafts and clothes", "Caplaki Craft Village", "Kigali Convention Centre area shops"],
    culture: ["Kigali Genocide Memorial (international importance)", "Inema Arts Center (Rwandan contemporary art)", "Ethnographic Museum in Butare (nearby)", "Iby'Iwacu Cultural Village"]
  },

  // ── MOLDOVA / REMAINING ──
  "mauritania-nouakchott": {
    name: "Nouakchott", country: "Mauritania", state: "Nouakchott Region",
    landmarks: ["Port de Pêche (Fish Market)", "Saudi Mosque (Grand Mosque)", "National Museum of Mauritania", "Terjit Oasis (nearby)", "Ben Amera monolith (world's 2nd largest)"],
    neighborhoods: ["Capitale", "Ksar", "Tevragh-Zeina"],
    food: ["Thieboudienne (fish and rice)", "Mechoui (roasted lamb)", "Couscous with camel meat", "Date-based sweets", "Atay (mint tea ceremony)"],
    activities: ["Sahara desert dune excursions", "Port de Pêche fish market at sunrise", "Day trip to Terjit Oasis"],
    shopping: ["Marché Capitale", "Socogim market"],
    culture: ["National Museum of Mauritania", "Traditional nomadic culture encounters", "Ksour (ancient fortified villages in nearby Adrar)"]
  },

  // ── NORTH MACEDONIA ──
  "skopje": {
    name: "Skopje", country: "North Macedonia", state: "Skopje Statistical Region",
    landmarks: ["Alexander the Great Square (Macedonia Square)", "Kale Fortress", "Old Bazaar (Čaršija)", "Stone Bridge", "Millennium Cross on Mount Vodno", "Mother Teresa Memorial House", "Matka Canyon"],
    neighborhoods: ["Old Bazaar", "City Centre", "Čair", "Karpoš"],
    food: ["Tavče gravče (baked beans)", "Ajvar (roasted pepper spread)", "Shopska salata", "Kebapi (grilled minced meat)", "Burek with cheese", "Turli tava (mixed meat casserole)"],
    activities: ["Matka Canyon kayaking and cave exploration", "Millennium Cross cable car ride up Mount Vodno", "Old Bazaar walking tour", "Day trip to Lake Ohrid"],
    shopping: ["Old Bazaar handcraft shops", "GTC Shopping Center", "Ramstore Mall"],
    culture: ["Old Bazaar (largest in Balkans outside Istanbul)", "Museum of Macedonia", "Memorial House of Mother Teresa (born in Skopje)", "Kale Fortress history"]
  },

  // ── SIERRA LEONE ──
  "freetown": {
    name: "Freetown", country: "Sierra Leone", state: "Western Area",
    landmarks: ["Cotton Tree (historic symbol)", "Sierra Leone National Museum", "Bunce Island slave fort", "Tacugama Chimpanzee Sanctuary", "Lumley Beach"],
    neighborhoods: ["Hill Station", "Lumley", "Aberdeen", "East End"],
    food: ["Cassava leaf stew", "Egusi soup", "Rice bread", "Groundnut soup", "Jollof rice", "Freetown fish and chips"],
    activities: ["Tacugama Chimpanzee Sanctuary visit", "Banana Islands snorkeling day trip", "Turtle Islands eco-visit", "Bunce Island historical tour"],
    shopping: ["Freetown City Centre Market", "Aberdeen craft stalls"],
    culture: ["Sierra Leone National Museum", "Cotton Tree historical significance", "Krio cultural heritage"]
  },

  // ── VANUATU ──
  "port vila": {
    name: "Port Vila", country: "Vanuatu", state: "Shefa Province",
    landmarks: ["Mele Cascades waterfall", "National Museum of Vanuatu", "Seafront Promenade", "Erakor Island", "Efate Ring Road"],
    neighborhoods: ["Port Vila Town", "Erakor", "Freshwota"],
    food: ["Lap lap (root vegetable baked dish)", "Bougna (coconut-cooked feast)", "Fresh seafood", "Kumala (sweet potato) dishes", "Tusker beer (local brew)"],
    activities: ["Swimming at Blue Lagoon Efate", "Volcano hike on Tanna Island (Yasur volcano)", "Mele Cascades waterfall hike and swim", "Traditional kastom village visit"],
    shopping: ["Port Vila Central Market", "Handicraft Market waterfront"],
    culture: ["National Museum of Vanuatu", "Traditional kastom ceremonies", "Sand drawing (UNESCO heritage)"]
  },

  // ── SURINAME ──
  "paramaribo": {
    name: "Paramaribo", country: "Suriname", state: "Paramaribo District",
    landmarks: ["Historic Inner City of Paramaribo (UNESCO)", "Saint Peter and Paul Cathedral (largest wooden church in Americas)", "Fort Zeelandia", "Central Market", "Presidential Palace"],
    neighborhoods: ["UNESCO Historic Centre", "Rainville", "Latour"],
    food: ["Pom (taro root with chicken)", "Roti met aardappel (curry roti)", "Bami (fried noodles)", "Peanut soup", "Loempia (spring rolls)", "Javanese-Surinamese fusion cuisine"],
    activities: ["Amazon jungle day trip from Paramaribo", "Fort Zeelandia history museum", "UNESCO Inner City walking tour", "Central Suriname Nature Reserve excursion"],
    shopping: ["Central Market", "De Grootste Supermarkt"],
    culture: ["UNESCO Historic Inner City", "Fort Zeelandia museum", "Unique blend of Dutch, Javanese, Creole, Hindu, Jewish, and Maroon cultures"]
  },
};

// New regions
const newRegions = {
  "transylvania": { name: "Transylvania", country: "Romania", cities: ["Brasov", "Sibiu", "Cluj-Napoca", "Sighisoara", "Sinaia"] },
  "tunis governorate": { name: "Tunis Governorate", country: "Tunisia", cities: ["Tunis", "Sfax", "Sousse", "Kairouan", "Monastir"] },
  "marrakech-safi": { name: "Marrakech-Safi", country: "Morocco", cities: ["Marrakech", "Essaouira", "El-Jadida"] },
  "fès-meknès": { name: "Fès-Meknès", country: "Morocco", cities: ["Fes", "Meknès", "Ifrane"] },
  "casablanca-settat": { name: "Casablanca-Settat", country: "Morocco", cities: ["Casablanca", "Mohammedia", "El-Jadida"] },
  "mandalay region": { name: "Mandalay Region", country: "Myanmar", cities: ["Bagan", "Mandalay", "Pyin Oo Lwin"] },
  "yangon region": { name: "Yangon Region", country: "Myanmar", cities: ["Yangon", "Thanlyin", "Insein"] },
  "metro manila": { name: "Metro Manila", country: "Philippines", cities: ["Manila", "Quezon City", "Makati", "Pasig", "Taguig"] },
  "cebu": { name: "Cebu", country: "Philippines", cities: ["Cebu City", "Mandaue", "Lapu-Lapu"] },
  "lesser poland": { name: "Lesser Poland", country: "Poland", cities: ["Krakow", "Zakopane", "Tarnów"] },
  "masovian voivodeship": { name: "Masovian Voivodeship", country: "Poland", cities: ["Warsaw", "Radom", "Płock"] },
  "ad dawhah": { name: "Ad Dawhah", country: "Qatar", cities: ["Doha", "Al Wakrah", "Al Khor"] },
  "kyiv city": { name: "Kyiv City", country: "Ukraine", cities: ["Kyiv"] },
  "lviv oblast": { name: "Lviv Oblast", country: "Ukraine", cities: ["Lviv", "Drohobych", "Stryi"] },
  "montevideo department": { name: "Montevideo Department", country: "Uruguay", cities: ["Montevideo"] },
  "samarkand region": { name: "Samarkand Region", country: "Uzbekistan", cities: ["Samarkand", "Kattakurgan"] },
  "bukhara region": { name: "Bukhara Region", country: "Uzbekistan", cities: ["Bukhara", "Karakul"] },
  "tashkent region": { name: "Tashkent Region", country: "Uzbekistan", cities: ["Tashkent", "Chirchiq"] },
  "capital district": { name: "Capital District", country: "Venezuela", cities: ["Caracas", "La Guaira"] },
  "sanaa governorate": { name: "Sanaa Governorate", country: "Yemen", cities: ["Sanaa"] },
  "lusaka province": { name: "Lusaka Province", country: "Zambia", cities: ["Lusaka", "Kafue"] },
  "harare province": { name: "Harare Province", country: "Zimbabwe", cities: ["Harare"] },
  "matabeleland north": { name: "Matabeleland North", country: "Zimbabwe", cities: ["Victoria Falls", "Hwange"] },
  "central region uganda": { name: "Central Region", country: "Uganda", cities: ["Kampala", "Entebbe"] },
  "port of spain": { name: "Port of Spain", country: "Trinidad and Tobago", cities: ["Port of Spain", "San Fernando"] },
  "tongatapu": { name: "Tongatapu", country: "Tonga", cities: ["Nukuʻalofa"] },
  "south eastern region malta": { name: "South Eastern Region", country: "Malta", cities: ["Valletta", "Mdina", "Marsaxlokk"] },
  "port louis district": { name: "Port Louis District", country: "Mauritius", cities: ["Port Louis", "Beau Bassin-Rose Hill"] },
  "chisinau municipality": { name: "Chișinău Municipality", country: "Moldova", cities: ["Chișinău"] },
  "monaco": { name: "Monaco", country: "Monaco", cities: ["Monte Carlo", "La Condamine", "Monaco-Ville"] },
  "kotor municipality": { name: "Kotor Municipality", country: "Montenegro", cities: ["Kotor", "Perast"] },
  "vestland": { name: "Vestland", country: "Norway", cities: ["Bergen", "Voss", "Sogndal"] },
  "muscat governorate": { name: "Muscat Governorate", country: "Oman", cities: ["Muscat", "Muttrah", "Seeb"] },
  "lagos state": { name: "Lagos State", country: "Nigeria", cities: ["Lagos", "Ikeja", "Badagry"] },
  "federal capital territory nigeria": { name: "Federal Capital Territory", country: "Nigeria", cities: ["Abuja"] },
  "cusco region": { name: "Cusco Region", country: "Peru", cities: ["Cusco", "Machu Picchu", "Ollantaytambo"] },
  "lima region": { name: "Lima Region", country: "Peru", cities: ["Lima", "Callao", "Miraflores"] },
  "panama province": { name: "Panama Province", country: "Panama", cities: ["Panama City", "La Chorrera"] },
  "punjab pakistan": { name: "Punjab", country: "Pakistan", cities: ["Lahore", "Faisalabad", "Rawalpindi", "Multan"] },
  "islamabad capital territory": { name: "Islamabad Capital Territory", country: "Pakistan", cities: ["Islamabad", "Rawalpindi"] },
  "kaafu atoll": { name: "Kaafu Atoll", country: "Maldives", cities: ["Malé", "Hulhumalé"] },
  "kigali province": { name: "Kigali Province", country: "Rwanda", cities: ["Kigali"] },
  "nouakchott region": { name: "Nouakchott Region", country: "Mauritania", cities: ["Nouakchott"] },
  "skopje statistical region": { name: "Skopje Statistical Region", country: "North Macedonia", cities: ["Skopje"] },
  "western area": { name: "Western Area", country: "Sierra Leone", cities: ["Freetown"] },
  "shefa province": { name: "Shefa Province", country: "Vanuatu", cities: ["Port Vila"] },
  "paramaribo district": { name: "Paramaribo District", country: "Suriname", cities: ["Paramaribo"] },
  "ulaanbaatar": { name: "Ulaanbaatar", country: "Mongolia", cities: ["Ulaanbaatar"] },
};

// Merge into DB
let citiesAdded = 0;
let regionsAdded = 0;

for (const [key, val] of Object.entries(newCities)) {
  if (!db.cities[key]) {
    db.cities[key] = val;
    citiesAdded++;
  }
}

for (const [key, val] of Object.entries(newRegions)) {
  if (!db.regions[key]) {
    db.regions[key] = val;
    regionsAdded++;
  }
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
console.log(`Done! Added ${citiesAdded} cities and ${regionsAdded} regions.`);
console.log(`Final totals: ${Object.keys(db.cities).length} cities, ${Object.keys(db.regions).length} regions.`);
