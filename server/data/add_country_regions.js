const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./server/data/known_cities.json', 'utf-8'));

const extraRegions = {
  'morocco': { name: 'Morocco', country: 'Morocco', cities: ['Marrakech', 'Fes', 'Casablanca', 'Chefchaouen', 'Rabat', 'Essaouira'] },
  'tuscany': { name: 'Tuscany', country: 'Italy', cities: ['Florence', 'Siena', 'Pisa', 'Lucca', 'Arezzo'] },
  'ukraine': { name: 'Ukraine', country: 'Ukraine', cities: ['Kyiv', 'Lviv', 'Odessa', 'Kharkiv'] },
  'uzbekistan': { name: 'Uzbekistan', country: 'Uzbekistan', cities: ['Tashkent', 'Samarkand', 'Bukhara', 'Khiva'] },
  'peru': { name: 'Peru', country: 'Peru', cities: ['Lima', 'Cusco', 'Arequipa', 'Iquitos'] },
  'philippines': { name: 'Philippines', country: 'Philippines', cities: ['Manila', 'Cebu City', 'Boracay', 'Palawan', 'Davao'] },
  'myanmar': { name: 'Myanmar', country: 'Myanmar', cities: ['Yangon', 'Bagan', 'Mandalay', 'Inle Lake'] },
  'mongolia': { name: 'Mongolia', country: 'Mongolia', cities: ['Ulaanbaatar', 'Karakorum', 'Olgii'] },
  'tunisia': { name: 'Tunisia', country: 'Tunisia', cities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Hammamet'] },
  'venezuela': { name: 'Venezuela', country: 'Venezuela', cities: ['Caracas', 'Maracaibo', 'Valencia', 'Los Roques'] },
  'zimbabwe': { name: 'Zimbabwe', country: 'Zimbabwe', cities: ['Harare', 'Victoria Falls', 'Bulawayo'] },
  'zambia': { name: 'Zambia', country: 'Zambia', cities: ['Lusaka', 'Livingstone', 'Kafue'] },
  'rwanda': { name: 'Rwanda', country: 'Rwanda', cities: ['Kigali', 'Volcanoes NP', 'Nyungwe Forest'] },
  'uganda': { name: 'Uganda', country: 'Uganda', cities: ['Kampala', 'Entebbe', 'Jinja'] },
  'maldives': { name: 'Maldives', country: 'Maldives', cities: ['Male', 'Hulhumale', 'South Ari Atoll'] },
  'malta': { name: 'Malta', country: 'Malta', cities: ['Valletta', 'Mdina', 'Marsaxlokk', 'Gozo', 'Comino'] },
  'mauritius': { name: 'Mauritius', country: 'Mauritius', cities: ['Port Louis', 'Grand Baie', 'Flic en Flac', 'Chamarel'] },
  'moldova': { name: 'Moldova', country: 'Moldova', cities: ['Chisinau', 'Tiraspol', 'Orheiul Vechi'] },
  'suriname': { name: 'Suriname', country: 'Suriname', cities: ['Paramaribo', 'Nieuw Nickerie'] },
  'vanuatu': { name: 'Vanuatu', country: 'Vanuatu', cities: ['Port Vila', 'Luganville', 'Tanna Island'] },
  'tonga': { name: 'Tonga', country: 'Tonga', cities: ['Nukualofa', 'Haapai', 'Vavau'] },
  'trinidad and tobago': { name: 'Trinidad and Tobago', country: 'Trinidad and Tobago', cities: ['Port of Spain', 'San Fernando', 'Scarborough'] },
  'oman': { name: 'Oman', country: 'Oman', cities: ['Muscat', 'Nizwa', 'Salalah', 'Sur'] },
  'qatar': { name: 'Qatar', country: 'Qatar', cities: ['Doha', 'Al Wakrah', 'Al Khor'] },
  'nigeria': { name: 'Nigeria', country: 'Nigeria', cities: ['Lagos', 'Abuja', 'Ibadan', 'Kano', 'Benin City'] },
  'pakistan': { name: 'Pakistan', country: 'Pakistan', cities: ['Lahore', 'Islamabad', 'Karachi', 'Peshawar', 'Multan'] },
  'poland': { name: 'Poland', country: 'Poland', cities: ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan'] },
  'romania': { name: 'Romania', country: 'Romania', cities: ['Bucharest', 'Brasov', 'Sibiu', 'Cluj-Napoca'] },
  'norway': { name: 'Norway', country: 'Norway', cities: ['Oslo', 'Bergen', 'Tromso', 'Stavanger'] },
  'ukraine': { name: 'Ukraine', country: 'Ukraine', cities: ['Kyiv', 'Lviv', 'Odessa', 'Kharkiv'] },
  'uruguay': { name: 'Uruguay', country: 'Uruguay', cities: ['Montevideo', 'Colonia del Sacramento', 'Punta del Este'] },
  'north macedonia': { name: 'North Macedonia', country: 'North Macedonia', cities: ['Skopje', 'Ohrid', 'Bitola'] },
  'montenegro': { name: 'Montenegro', country: 'Montenegro', cities: ['Kotor', 'Podgorica', 'Budva', 'Tivat'] },
  'sierra leone': { name: 'Sierra Leone', country: 'Sierra Leone', cities: ['Freetown', 'Bo', 'Kenema'] },
  'mauritania': { name: 'Mauritania', country: 'Mauritania', cities: ['Nouakchott', 'Nouadhibou', 'Chinguetti'] },
};

let added = 0;
for (const [key, val] of Object.entries(extraRegions)) {
  if (!db.regions[key]) {
    db.regions[key] = val;
    added++;
  }
}

fs.writeFileSync('./server/data/known_cities.json', JSON.stringify(db, null, 2), 'utf-8');
console.log('Added', added, 'country-level regions.');
console.log('Final totals - Regions:', Object.keys(db.regions).length, '| Cities:', Object.keys(db.cities).length);
