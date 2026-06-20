const fs = require('fs');
const path = require('path');

const regionsMapping = {
  "scotland": { name: "Scotland", country: "United Kingdom", cities: ["Edinburgh", "Glasgow", "Inverness", "Isle of Skye", "Aberdeen"] },
  "tamil nadu": { name: "Tamil Nadu", country: "India", cities: ["Chennai", "Madurai", "Coimbatore", "Ooty", "Kanyakumari", "Rameshwaram"] },
  "bihar": { name: "Bihar", country: "India", cities: ["Patna", "Gaya", "Nalanda", "Rajgir", "Bodhgaya"] },
  "himachal pradesh": { name: "Himachal Pradesh", country: "India", cities: ["Shimla", "Manali", "Dharamshala", "Dalhousie", "Kasol"] },
  "rajasthan": { name: "Rajasthan", country: "India", cities: ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar"] },
  "goa": { name: "Goa", country: "India", cities: ["Panaji", "Calangute", "Margao", "Vagator", "Palolem"] },
  "kerala": { name: "Kerala", country: "India", cities: ["Kochi", "Munnar", "Alleppey", "Varkala", "Trivandrum"] },
  "karnataka": { name: "Karnataka", country: "India", cities: ["Bengaluru", "Mysuru", "Hampi", "Coorg", "Gokarna"] },
  "maharashtra": { name: "Maharashtra", country: "India", cities: ["Mumbai", "Pune", "Lonavala", "Aurangabad", "Nashik"] },
  "west bengal": { name: "West Bengal", country: "India", cities: ["Kolkata", "Darjeeling", "Siliguri", "Kalimpong", "Digha"] },
  "andhra pradesh": { name: "Andhra Pradesh", country: "India", cities: ["Visakhapatnam", "Vijayawada", "Tirupati", "Nellore", "Kurnool"] },
  "telangana": { name: "Telangana", country: "India", cities: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"] },
  "bavaria": { name: "Bavaria", country: "Germany", cities: ["Munich", "Nuremberg", "Rothenburg ob der Tauber", "Füssen", "Regensburg"] },
  "california": { name: "California", country: "United States", cities: ["San Francisco", "Los Angeles", "San Diego", "Sacramento", "Yosemite Valley"] },
  
  // Countries
  "france": { name: "France", country: "France", cities: ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux"] },
  "japan": { name: "Japan", country: "Japan", cities: ["Tokyo", "Kyoto", "Osaka", "Nara", "Hiroshima"] },
  "italy": { name: "Italy", country: "Italy", cities: ["Rome", "Florence", "Venice", "Milan", "Naples"] },
  "united kingdom": { name: "United Kingdom", country: "United Kingdom", cities: ["London", "Edinburgh", "Bath", "Manchester", "York"] },
  "uk": { name: "United Kingdom", country: "United Kingdom", cities: ["London", "Edinburgh", "Bath", "Manchester", "York"] },
  "usa": { name: "United States", country: "United States", cities: ["New York", "Los Angeles", "Chicago", "San Francisco", "Miami"] },
  "united states": { name: "United States", country: "United States", cities: ["New York", "Los Angeles", "Chicago", "San Francisco", "Miami"] },
  "thailand": { name: "Thailand", country: "Thailand", cities: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Krabi"] },
  "spain": { name: "Spain", country: "Spain", cities: ["Madrid", "Barcelona", "Seville", "Valencia", "Granada"] },
  "germany": { name: "Germany", country: "Germany", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"] },
  "russia": { name: "Russia", country: "Russia", cities: ["Moscow", "St. Petersburg", "Kazan", "Sochi", "Vladivostok"] },
  "egypt": { name: "Egypt", country: "Egypt", cities: ["Cairo", "Luxor", "Aswan", "Alexandria", "Hurghada"] },
  "turkey": { name: "Turkey", country: "Turkey", cities: ["Istanbul", "Antalya", "Cappadocia", "Ephesus", "Izmir"] },
  "australia": { name: "Australia", country: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Cairns"] },
  "canada": { name: "Canada", country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Quebec City", "Banff"] },
  "brazil": { name: "Brazil", country: "Brazil", cities: ["Rio de Janeiro", "Sao Paulo", "Salvador", "Manaus", "Foz do Iguacu"] },
  "nepal": { name: "Nepal", country: "Nepal", cities: ["Kathmandu", "Pokhara", "Chitwan", "Lumbini", "Nagarkot"] },
  "south africa": { name: "South Africa", country: "South Africa", cities: ["Cape Town", "Johannesburg", "Durban", "Kruger National Park", "Pretoria"] },
  "singapore": { name: "Singapore", country: "Singapore", cities: ["Singapore"] },
  "mexico": { name: "Mexico", country: "Mexico", cities: ["Mexico City", "Cancun", "Oaxaca", "Guadalajara", "Merida"] },
  "netherlands": { name: "Netherlands", country: "Netherlands", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"] },
  "switzerland": { name: "Switzerland", country: "Switzerland", cities: ["Zurich", "Geneva", "Interlaken", "Lucerne", "Zermatt"] },
  "austria": { name: "Austria", country: "Austria", cities: ["Vienna", "Salzburg", "Innsbruck", "Hallstatt", "Graz"] },
  "belgium": { name: "Belgium", country: "Belgium", cities: ["Brussels", "Bruges", "Ghent", "Antwerp"] },
  "greece": { name: "Greece", country: "Greece", cities: ["Athens", "Santorini", "Mykonos", "Crete", "Thessaloniki"] },
  "portugal": { name: "Portugal", country: "Portugal", cities: ["Lisbon", "Porto", "Sintra", "Faro", "Coimbra"] },
  "vietnam": { name: "Vietnam", country: "Vietnam", cities: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hoi An", "Nha Trang"] },
  "indonesia": { name: "Indonesia", country: "Indonesia", cities: ["Jakarta", "Bali", "Yogyakarta", "Lombok", "Surabaya"] },
  "south korea": { name: "South Korea", country: "South Korea", cities: ["Seoul", "Busan", "Jeju City", "Gyeongju", "Incheon"] },
  "malaysia": { name: "Malaysia", country: "Malaysia", cities: ["Kuala Lumpur", "Penang", "Malacca", "Langkawi", "Kota Kinabalu"] },
  "new zealand": { name: "New Zealand", country: "New Zealand", cities: ["Auckland", "Queenstown", "Wellington", "Christchurch", "Rotorua"] }
};

const citiesDb = {
  // === United Kingdom ===
  "edinburgh": {
    name: "Edinburgh", country: "United Kingdom", state: "Scotland",
    landmarks: ["Edinburgh Castle", "Royal Mile", "Arthur's Seat", "Calton Hill", "Palace of Holyroodhouse", "Scott Monument", "Dean Village", "St Giles' Cathedral", "Greyfriars Kirkyard", "Real Mary King's Close"],
    neighborhoods: ["Old Town", "New Town", "Stockbridge", "Leith", "Grassmarket", "Bruntsfield"],
    food: ["Haggis, Neeps and Tatties", "Cullen Skink soup", "Traditional Scotch Pie", "Scottish Shortbread", "Single Malt Scotch Whisky", "Deep-Fried Mars Bar at local chippy", "Deacon Brodie's Tavern", "The Bow Bar"],
    activities: ["Hiking up Arthur's Seat for sunrise panoramic views", "Taking a ghost tour in the underground vaults", "Scotch whisky tasting at the Scotch Whisky Experience", "Walking the historic Royal Mile from the Castle to the Palace", "Watching the sunset from Calton Hill", "Strolling along the Water of Leith walkway through Dean Village"],
    shopping: ["Princes Street high street shopping", "George Street designer boutiques", "Weekly Grassmarket Market for local crafts", "Sunday Stockbridge Market", "Victoria Street colorful boutique shops"],
    culture: ["National Museum of Scotland", "Scottish National Gallery on The Mound", "The Writers' Museum in Lady Stair's Close", "Holyrood Abbey ruins", "The historic Georgian House in Charlotte Square"]
  },
  "london": {
    name: "London", country: "United Kingdom", state: "England",
    landmarks: ["Big Ben and Houses of Parliament", "Tower of London", "Tower Bridge", "London Eye", "British Museum", "Buckingham Palace", "Westminster Abbey", "Trafalgar Square", "St. Paul's Cathedral", "Hyde Park"],
    neighborhoods: ["Soho", "Covent Garden", "Notting Hill", "Westminster", "Camden Town", "Shoreditch", "Greenwich", "Kensington"],
    food: ["Fish and Chips at Rock & Sole Plaice", "Traditional Sunday Roast with Yorkshire pudding", "Afternoon Tea at Fortnum & Mason", "Full English Breakfast", "Brick Lane Curry Houses", "Borough Market street food stalls"],
    activities: ["Walking across the historic Tower Bridge", "Watching a West End theater musical show", "Riding the giant London Eye at sunset", "Exploring the treasures of the British Museum", "Watching the Changing of the Guard at Buckingham Palace", "Taking a speed boat ride along the River Thames"],
    shopping: ["Oxford Street and Regent Street shopping hubs", "Portobello Road Antique Market in Notting Hill", "Camden Lock Market for alternative crafts", "Borough Market fresh food stalls", "Harrods luxury department store in Knightsbridge"],
    culture: ["The National Gallery in Trafalgar Square", "Tate Modern art museum by the Thames", "Westminster Abbey royal coronation church", "Shakespeare's Globe Theatre", "The Victoria and Albert Museum in South Kensington"]
  },
  "bath": {
    name: "Bath", country: "United Kingdom", state: "England",
    landmarks: ["The Roman Baths", "Bath Abbey", "The Royal Crescent", "The Circus", "Pulteney Bridge", "Thermae Bath Spa", "Prior Park Landscape Garden", "Jane Austen Centre"],
    neighborhoods: ["Georgian City Centre", "Milsom Quarter", "Walcot Street artisan quarter", "Widcombe", "Lansdown"],
    food: ["Sally Lunn's Bun", "Bath Bun", "Traditional afternoon tea at the Pump Room", "Local Somerset cider", "Bath Soft Cheese", "Gastropub dining in city taverns"],
    activities: ["Touring the ancient Roman Baths museum", "Bathing in naturally warm waters at Thermae Bath Spa", "Walking along the architectural marvel of Royal Crescent", "Cruising on the River Avon", "Walking the skyline trail for panoramic city views"],
    shopping: ["Milsom Street independent shops", "Walcot Street Artisan Market", "Guildhall Market", "Green Park Station weekly food markets"],
    culture: ["Museum of Bath Architecture", "The Holburne Art Museum", "Jane Austen Centre exhibitions", "The Hershey Museum of East Asian Art"]
  },
  "glasgow": {
    name: "Glasgow", country: "United Kingdom", state: "Scotland",
    landmarks: ["Kelvingrove Art Gallery and Museum", "Glasgow Cathedral", "Glasgow Botanic Gardens", "Riverside Museum", "Glasgow Science Centre", "The Tenement House", "George Square", "People's Palace"],
    neighborhoods: ["West End", "Merchant City", "Finnieston", "Southside", "East End"],
    food: ["Scottish Salmon", "Haggis bon-bons", "Local craft beers in Finnieston pubs", "Tunnock's Teacakes", "Traditional Cullen Skink", "High-quality seafood at local bistros"],
    activities: ["Exploring the vast Kelvingrove Art Gallery", "Strolling through the Botanic Gardens glasshouses", "Exploring the Clyde riverfront", "Walking past historic architecture in Merchant City", "Attending live music at King Tut's Wah Wah Hut"],
    shopping: ["Buchanan Street Style Mile", "The Barras Weekend Market", "West End vintage clothing boutiques", "Merchant Square Craft Market"],
    culture: ["The Hunterian Museum", "Charles Rennie Mackintosh architecture trail", "Glasgow Cathedral historic crypt", "The Gallery of Modern Art (GoMA)"]
  },
  "inverness": {
    name: "Inverness", country: "United Kingdom", state: "Scotland",
    landmarks: ["Inverness Castle", "Loch Ness and Urquhart Castle ruins", "Inverness Cathedral", "Ness Islands", "Culloden Battlefield", "Clava Cairns", "Leakey's Bookshop"],
    neighborhoods: ["Riverside", "Crown", "Haugh", "Clachnaharry", "Merkinch"],
    food: ["Scottish Venison", "Freshly caught River Ness Salmon", "Traditional oatcakes and cheese", "Highland single malt whisky at local pubs", "Craft gin tastings"],
    activities: ["Taking a Loch Ness boat cruise to spot Nessie", "Walking across the suspension bridges of Ness Islands", "Exploring the historic Culloden Battlefield", "Strolling along the Caledonian Canal", "Visiting the mysterious Clava Cairns standing stones"],
    shopping: ["Victorian Market independent stores", "Eastgate Shopping Centre", "Highland House of Fraser for kilts and tartans"],
    culture: ["Inverness Museum and Art Gallery", "Urquhart Castle medieval ruins", "Culloden Battlefield Visitor Centre", "Traditional Scottish ceilidh music sessions at local taverns"]
  },
  "isle of skye": {
    name: "Isle of Skye", country: "United Kingdom", state: "Scotland",
    landmarks: ["The Old Man of Storr", "Quiraing landslide trail", "Fairy Pools", "Neist Point Lighthouse", "Dunvegan Castle", "Talisker Distillery", "Portree Harbor", "Kilt Rock and Mealt Falls"],
    neighborhoods: ["Portree", "Broadford", "Dunvegan", "Uig", "Carbost"],
    food: ["Skye oysters and fresh mussels", "Freshly caught scallops and lobster", "Talisker single malt whisky", "Traditional oatcakes", "Local venison burgers"],
    activities: ["Hiking up to the iconic Old Man of Storr rock pinnacle", "Swimming in the cold crystal-clear Fairy Pools", "Hiking the dramatic Quiraing ridge", "Walking to the edge of Neist Point Lighthouse at sunset", "Taking a guided tour and tasting at Talisker Distillery"],
    shopping: ["Portree colorful harbor craft shops", "Skye Weavers workshop", "Local pottery studios in Uig", "Distillery gift shops"],
    culture: ["Dunvegan Castle and Gardens (Clan MacLeod seat)", "The Museum of Island Life in Kilmuir", "Flora Macdonald's grave, monument and local monuments"]
  },
  "aberdeen": {
    name: "Aberdeen", country: "United Kingdom", state: "Scotland",
    landmarks: ["Marischal College", "Duthie Park and David Welch Winter Gardens", "Footdee (Fittie) historic fishing village", "Aberdeen Art Gallery", "St. Machar's Cathedral", "Aberdeen Beach and Esplanade", "Brig o' Balgownie"],
    neighborhoods: ["Old Aberdeen", "Rosemount", "West End", "Footdee", "City Centre"],
    food: ["Aberdeen Angus beef steak", "Butteries (rowies) local pastry", "Freshly landed cod and haddock", "Craft beers from local breweries", "Highland single malt whiskies"],
    activities: ["Walking through the tiny historic cottages of Footdee", "Strolling in the Winter Gardens greenhouses", "Walking along the Aberdeen beach esplanade", "Exploring the medieval cobblestone lanes of Old Aberdeen", "Visiting the grand granite Marischal College facade"],
    shopping: ["Union Street shopping strip", "Union Square Mall", "Belmont Street organic farmers market"],
    culture: ["Aberdeen Art Gallery exhibitions", "Maritime Museum detailing North Sea history", "Provost Skene's House historic rooms", "St. Machar's Cathedral twin towers"]
  },

  // === United States ===
  "new york": {
    name: "New York", country: "United States", state: "New York",
    landmarks: ["Statue of Liberty and Ellis Island", "Empire State Building", "Central Park", "Times Square", "Brooklyn Bridge", "Metropolitan Museum of Art (The Met)", "Museum of Modern Art (MoMA)", "The High Line park", "Rockefeller Center", "One World Observatory"],
    neighborhoods: ["Manhattan", "Brooklyn Heights", "Soho", "Greenwich Village", "Chinatown", "Little Italy", "DUMBO", "Williamsburg", "Harlem", "Chelsea"],
    food: ["Classic New York slice of pizza", "Bagels with Lox and Cream Cheese", "Pastrami Sandwich at Katz's Deli", "New York Cheesecake", "Nathan's Famous Hot Dogs on Coney Island", "Craft cocktails at East Village speakeasies"],
    activities: ["Walking across the Brooklyn Bridge at sunset", "Renting a rowboat on Central Park lake", "Catching a world-class Broadway musical show in Times Square", "Strolling the elevated High Line public park", "Enjoying panoramic views from the Top of the Rock", "Ferry ride past the Statue of Liberty"],
    shopping: ["Fifth Avenue designer shopping belt", "Soho boutique stores", "Chelsea Market artisanal shops", "Macy's Herald Square", "Brooklyn Flea Market in Williamsburg"],
    culture: ["The Metropolitan Museum of Art (The Met)", "Museum of Modern Art (MoMA)", "Guggenheim Museum", "American Museum of Natural History", "9/11 Memorial & Museum"]
  },
  "los angeles": {
    name: "Los Angeles", country: "United States", state: "California",
    landmarks: ["Hollywood Sign", "Griffith Observatory", "Santa Monica Pier", "Getty Center", "Los Angeles County Museum of Art (LACMA)", "Universal Studios Hollywood", "Hollywood Walk of Fame", "Rodeo Drive", "Venice Beach Boardwalk", "Walt Disney Concert Hall"],
    neighborhoods: ["Hollywood", "Beverly Hills", "Santa Monica", "Venice Beach", "Downtown LA", "Silver Lake", "Koreatown", "West Hollywood"],
    food: ["Tacos from Leo's Tacos Truck", "Double-Double burger at In-N-Out Burger", "French Dip sandwich at Philippe the Original", "Korean BBQ in Koreatown", "Fresh seafood on Santa Monica Pier", "Avocado toast at hipster Silver Lake cafes"],
    activities: ["Hiking up to the Griffith Observatory for city views", "Walking along the busy Santa Monica Pier", "Strolling past the outdoor muscle beach in Venice", "Stargazing along the Hollywood Walk of Fame", "Driving down the scenic Sunset Boulevard", "Strolling the iconic Getty Center gardens"],
    shopping: ["Rodeo Drive luxury brands", "Abbot Kinney Boulevard boutiques in Venice", "The Grove outdoor shopping mall", "Melrose Avenue vintage clothing shops"],
    culture: ["The Getty Center collection", "LACMA outdoor lights installation", "Broad Contemporary Art Museum", "Natural History Museum of LA County", "La Brea Tar Pits fossils"]
  },
  "chicago": {
    name: "Chicago", country: "United States", state: "Illinois",
    landmarks: ["Millennium Park and The Bean", "Willis Tower Skydeck", "Navy Pier", "Art Institute of Chicago", "Shedd Aquarium", "Field Museum", "Wrigley Field", "Lincoln Park Zoo", "Magnificent Mile", "Chicago Riverwalk"],
    neighborhoods: ["The Loop", "River North", "Lincoln Park", "Wicker Park", "Gold Coast", "Pilsen", "Chinatown", "Wrigleyville"],
    food: ["Deep-dish pizza at Lou Malnati's or Giordano's", "Classic Chicago-style hot dog", "Italian Beef sandwich from Al's Beef", "Garrett Popcorn Mix", "Craft beers at local breweries"],
    activities: ["Taking an architectural boat tour along the Chicago River", "Stepping out onto The Ledge glass box at Willis Tower", "Snapping photos at Cloud Gate (The Bean) in Millennium Park", "Catching a baseball game at historic Wrigley Field", "Strolling along the Chicago Riverwalk", "Riding the Centennial Wheel at Navy Pier"],
    shopping: ["The Magnificent Mile (Michigan Avenue) shopping", "State Street shopping district", "Wicker Park independent boutiques", "Maxwell Street Market"],
    culture: ["The Art Institute of Chicago", "Field Museum of Natural History", "Shedd Aquarium", "Museum of Science and Industry", "Chicago Symphony Orchestra"]
  },
  "san francisco": {
    name: "San Francisco", country: "United States", state: "California",
    landmarks: ["Golden Gate Bridge", "Alcatraz Island", "Fisherman's Wharf and Pier 39", "Lombard Street", "Coit Tower", "Ghirardelli Square", "Painted Ladies (Alamo Square)", "Palace of Fine Arts", "San Francisco Museum of Modern Art (SFMOMA)", "Golden Gate Park"],
    neighborhoods: ["Chinatown", "Mission District", "Castro", "Haight-Ashbury", "North Beach (Little Italy)", "Pacific Heights", "Marina", "Soma"],
    food: ["Clam chowder in a sourdough bread bowl at Boudin", "Mission Burrito at La Taqueria", "Dungeness Crab at Fisherman's Wharf", "Dim sum in Chinatown", "Irish Coffee at The Buena Vista", "Artisan chocolate at Ghirardelli Square"],
    activities: ["Riding a historic cable car up the steep hills", "Taking a ferry tour to Alcatraz Island prison", "Walking or cycling across the Golden Gate Bridge", "Strolling down the winding turns of Lombard Street", "Watching sea lions at Pier 39", "Exploring the gardens and museums in Golden Gate Park"],
    shopping: ["Union Square shopping belt", "Ferry Building Marketplace for local foods", "Haight Street vintage shops", "Chinatown markets"],
    culture: ["Palace of Fine Arts theatre structure", "De Young Fine Arts Museum", "SFMOMA", "California Academy of Sciences", "Beat Museum in North Beach"]
  },
  "san diego": {
    name: "San Diego", country: "United States", state: "California",
    landmarks: ["San Diego Zoo", "Balboa Park", "USS Midway Museum", "Coronado Bridge and Hotel del Coronado", "La Jolla Cove", "Cabriollo National Monument", "Old Town San Diego State Historic Park", "Gaslamp Quarter", "Seaport Village", "Sunset Cliffs Natural Park"],
    neighborhoods: ["Gaslamp Quarter", "La Jolla", "Little Italy", "Coronado", "North Park", "Hillcrest", "Ocean Beach", "Old Town"],
    food: ["Baja fish tacos at local shacks", "California Burrito with french fries inside", "Fresh seafood in La Jolla", "Craft beer at local breweries (Ballast Point/Stone)", "Wood-fired pizza in Little Italy"],
    activities: ["Watching wild sea lions play at La Jolla Cove", "Exploring the historic aircraft carrier USS Midway", "Strolling through the Spanish-style gardens of Balboa Park", "Watching the sunset from Sunset Cliffs", "Taking a ferry to Coronado Island", "Visiting the world-famous San Diego Zoo"],
    shopping: ["Seaport Village waterfront shopping", "Gaslamp Quarter boutiques", "Hillcrest Farmer's Market", "Las Americas Premium Outlets"],
    culture: ["San Diego Museum of Us", "San Diego Museum of Art", "Old Town historic adobe buildings", "Fleet Science Center", "Coronado Historical Museum"]
  },
  "yosemite valley": {
    name: "Yosemite Valley", country: "United States", state: "California",
    landmarks: ["Half Dome", "El Capitan", "Yosemite Falls", "Bridalveil Fall", "Tunnel View", "Glacier Point", "Valley Visitors Center", "Vernal Fall", "Nevada Fall", "Mirror Lake"],
    neighborhoods: ["Yosemite Village", "Curry Village", "Wawona", "Tuolumne Meadows", "El Portal"],
    food: ["Hearty hikers' buffet at Curry Village", "Dinner at the historic Ahwahnee Hotel", "Trail mix and campfire s'mores", "Local California wines", "Craft beers by the campfire"],
    activities: ["Hiking the Mist Trail to Vernal and Nevada Falls", "Photographing the scenic panorama at Tunnel View", "Strolling to the base of Yosemite Falls", "Watching rock climbers tackle El Capitan's granite wall", "Hiking to Mirror Lake", "Watching the sunset over Half Dome from Sentinel Bridge"],
    shopping: ["Yosemite Village Store", "Ansel Adams Gallery for photography prints", "Wawona Store for local goods"],
    culture: ["Yosemite Museum and Indian Cultural Exhibit", "The historic Ahwahnee Hotel architecture", "Ansel Adams Gallery historical exhibits"]
  },
  "sacramento": {
    name: "Sacramento", country: "United States", state: "California",
    landmarks: ["California State Capitol", "Old Sacramento Waterfront", "Tower Bridge (Gold)", "California State Railroad Museum", "Crocker Art Museum", "Sutter's Fort State Historic Park", "Sacramento Zoo", "McKinley Park"],
    neighborhoods: ["Old Sacramento", "Midtown", "Downtown", "Land Park", "East Sacramento"],
    food: ["Farm-to-fork fresh local produce", "Craft beers in Midtown breweries", "Artisanal cheeses from Sacramento Valley", "Gourmet burgers", "Local Napa/Lodi wines"],
    activities: ["Touring the California State Capitol building and park", "Riding a historic steam train along Old Sacramento waterfront", "Exploring the gold rush era buildings of Old Sac", "Visiting Sutter's Fort historic park", "Strolling along the Sacramento River bike trail"],
    shopping: ["Old Sacramento waterfront souvenir shops", "Midtown weekly farmers market", "Downtown Commons (DOCO) outdoor shops"],
    culture: ["Crocker Art Museum (oldest public art museum in the West)", "California State Railroad Museum historical trains", "Sacramento History Museum gold rush exhibits"]
  },

  // === France ===
  "paris": {
    name: "Paris", country: "France", state: "Île-de-France",
    landmarks: ["Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral", "Arc de Triomphe", "Sacré-Cœur Basilica", "Musée d'Orsay", "Centre Pompidou", "Sainte-Chapelle", "Pantheon", "Palais Garnier"],
    neighborhoods: ["Montmartre", "Le Marais", "Latin Quarter", "Saint-Germain-des-Prés", "Champs-Élysées", "Canal Saint-Martin", "Belleville"],
    food: ["Fresh warm Croissants and Pain au Chocolat", "Snails (Escargots) in garlic butter", "Traditional Coq au Vin", "French Onion Soup", "Sweet Macarons from Ladurée", "Crepes at street stands", "Beef Bourguignon at a classic bistro", "Dining at Bouillon Chartier"],
    activities: ["Seine River dinner cruise at night", "Picnic in the Champ de Mars under the Eiffel Tower", "Climbing the Eiffel Tower steps", "Strolling in the historic Luxembourg Gardens", "Viewing impressionist art at Musée de l'Orangerie", "Watching a cabaret show at the Moulin Rouge"],
    shopping: ["Champs-Élysées luxury shopping", "Galeries Lafayette department store", "Le Marais boutique shops", "Rue de Rivoli", "Rue Saint-Honoré designer stores"],
    culture: ["Louvre Museum art treasures", "Musée d'Orsay impressionist works", "Notre-Dame historic area", "The Catacombs of Paris", "Palace of Versailles royal residence"]
  },
  "nice": {
    name: "Nice", country: "France", state: "Provence-Alpes-Côte d'Azur",
    landmarks: ["Promenade des Anglais", "Castle Hill (Colline du Château)", "Cours Saleya Flower Market", "Nice Cathedral", "Marc Chagall National Museum", "Matisse Museum", "Place Masséna", "Port Lympia"],
    neighborhoods: ["Vieux Nice (Old Town)", "Port District", "Cimiez", "Jean-Médecin", "Carré d'Or"],
    food: ["Salade Niçoise", "Socca (chickpea pancake)", "Pan Bagnat sandwich", "Pissaladière (onion tart)", "Fresh seafood on the waterfront", "Italian gelato in Vieux Nice"],
    activities: ["Walking the seafront Promenade des Anglais", "Climbing Castle Hill for panoramic bay views", "Buying fresh lavender at Cours Saleya Market", "Strolling past colorful yachts in Port Lympia", "Visiting the Marc Chagall National Museum"],
    shopping: ["Cours Saleya Flower and Food Market", "Avenue Jean Médecin high street shopping", "Vieux Nice artisan boutiques"],
    culture: ["Nice Cathedral historic interior", "Matisse Museum in Cimiez neighborhood", "Marc Chagall Museum", "Lascaris Palace musical instruments museum"]
  },
  "lyon": {
    name: "Lyon", country: "France", state: "Auvergne-Rhône-Alpes",
    landmarks: ["Basilica of Notre-Dame de Fourvière", "Ancient Theatre of Fourvière", "Place Bellecour", "Parc de la Tête d'Or", "Musée des Confluences", "Cathedral of Saint John the Baptist", "Traboules of Lyon", "Mur des Canuts"],
    neighborhoods: ["Vieux Lyon (Old Town)", "La Presqu'île", "La Croix-Rousse", "Confluence", "Part-Dieu"],
    food: ["Quenelles de brochet in Nantua sauce", "Saucisson de Lyon", "Tarte aux pralines dessert", "Local Beaujolais and Côtes du Rhône wines", "Dining at a traditional Bouchon Lyonnais restaurant", "Gervais cheese"],
    activities: ["Walking through the hidden Traboules passageways", "Climbing Fourvière Hill to the Basilica for city views", "Rowing a boat in Parc de la Tête d'Or lake", "Exploring the Roman amphitheater ruins", "Having lunch at Les Halles de Lyon Paul Bocuse food market"],
    shopping: ["Rue de la République shopping promenade", "La Croix-Rousse silk weaver boutiques", "Les Halles de Lyon Paul Bocuse specialty food stalls"],
    culture: ["Museum of Fine Arts of Lyon", "Musée des Confluences science museum", "Notre-Dame de Fourvière Basilica", "Lumière Museum (history of cinema)"]
  },

  // === Italy ===
  "rome": {
    name: "Rome", country: "Italy", state: "Lazio",
    landmarks: ["Colosseum", "Trevi Fountain", "Pantheon", "Roman Forum", "Spanish Steps", "Vatican Museums", "St. Peter's Basilica", "Piazza Navona", "Castel Sant'Angelo", "Villa Borghese"],
    neighborhoods: ["Trastevere", "Prati", "Monti", "Testaccio", "Centro Storico", "Campo de' Fiori"],
    food: ["Pasta Cacio e Pepe at Da Enzo al 29", "Classic Spaghetti alla Carbonara", "Pasta all'Amatriciana", "Roman-style thin pizza at Pizzarium Bonci", "Artisanal gelato from Giolitti", "Suppli street food", "Carciofi alla Romana"],
    activities: ["Tossing a coin into the Trevi Fountain at night", "Climbing the Spanish Steps", "Walking through the ancient Colosseum and Roman Forum", "Touring the Vatican Museums and the Sistine Chapel", "Walking or cycling in the Villa Borghese gardens", "Exploring the lively Trastevere bar scene"],
    shopping: ["Via del Corso shopping street", "Via Condotti luxury fashion boutiques", "Campo de' Fiori daily market", "Porta Portese Sunday flea market"],
    culture: ["St. Peter's Basilica", "Sistine Chapel", "Pantheon architectural masterpiece", "Catacombs of Rome", "Borghese Gallery art collection"]
  },
  "florence": {
    name: "Florence", country: "Italy", state: "Tuscany",
    landmarks: ["Florence Cathedral (Duomo)", "Ponte Vecchio bridge", "Uffizi Gallery", "Accademia Gallery and Michelangelo's David", "Palazzo Vecchio", "Piazza della Signoria", "Boboli Gardens", "Piazzale Michelangelo", "Basilica of Santa Croce"],
    neighborhoods: ["San Giovanni", "Santo Spirito", "Santa Maria Novella", "San Frediano", "San Niccolò"],
    food: ["Bistecca alla Fiorentina (Florentine steak)", "Ribollita vegetable soup", "Pappa al Pomodoro", "Schacciata flatbread sandwich at All'Antico Vinaio", "Tuscan Chianti wine", "Cantucci biscuits with Vin Santo"],
    activities: ["Climbing the Duomo dome for city views", "Walking across the medieval Ponte Vecchio bridge", "Viewing Botticelli's Birth of Venus at the Uffizi Gallery", "Viewing Michelangelo's David at the Accademia Gallery", "Watching the sunset over Florence from Piazzale Michelangelo", "Strolling in the Renaissance Boboli Gardens"],
    shopping: ["San Lorenzo Market leather goods stalls", "Mercato Centrale food market stalls", "Via de' Tornabuoni luxury shopping", "Artisan paper and leather workshops in Santo Spirito"],
    culture: ["Uffizi Gallery collections", "Santa Maria Novella historic church", "Medici Chapels", "Palazzo Pitti royal palace", "Santa Croce basilica (burial place of Michelangelo and Galileo)"]
  },
  "venice": {
    name: "Venice", country: "Italy", state: "Veneto",
    landmarks: ["St. Mark's Basilica", "St. Mark's Square", "Doge's Palace", "Rialto Bridge", "Grand Canal", "Bridge of Sighs", "Peggy Guggenheim Collection", "Teatro La Fenice", "Campanile di San Marco", "Murano Island"],
    neighborhoods: ["San Marco", "Cannaregio", "San Polo", "Dorsoduro", "Castello", "Santa Croce"],
    food: ["Cicchetti (Venetian tapas) at local bacari bars", "Sarde in Saor", "Risotto al nero di seppia (squid ink risotto)", "Bellini cocktail at Harry's Bar", "Fritto Misto seafood", "Bigoli in salsa"],
    activities: ["Taking a gondola ride along the quiet side canals", "Cruising the Grand Canal on a vaporetto water bus", "Visiting the ornate chambers of Doge's Palace", "Walking across the stone Rialto Bridge", "Feeding pigeons and listening to live orchestras in St. Mark's Square", "Watching a glassblowing demonstration on Murano Island"],
    shopping: ["Rialto Market fresh fish and produce stalls", "Mercerie shopping streets", "Murano glass workshops", "Burano lace shops", "Venetian mask artisan boutiques"],
    culture: ["St. Mark's Basilica gold mosaics", "Doge's Palace history museum", "Gallerie dell'Accademia art museum", "Peggy Guggenheim Collection", "Basilica di Santa Maria della Salute"]
  },

  // === Japan ===
  "tokyo": {
    name: "Tokyo", country: "Japan", state: "Tokyo",
    landmarks: ["Senso-ji Temple", "Tokyo Skytree", "Shibuya Crossing", "Tokyo Tower", "Meiji Shrine", "Imperial Palace Gardens", "Tsukiji Outer Market", "Shinjuku Gyoen National Garden", "Rainbow Bridge", "TeamLab Planets"],
    neighborhoods: ["Shibuya", "Shinjuku", "Harajuku", "Asakusa", "Akihabara", "Ginza", "Roppongi", "Golden Gai", "Omoide Yokocho"],
    food: ["Fresh Sushi at Tsukiji Outer Market", "Ramen noodles at Ichiran", "Crispy Tempura", "Grilled Yakitori skewers in Shinjuku's Omoide Yokocho", "Okonomiyaki savory pancakes", "Takoyaki octopus balls", "Gourmet Tonkatsu", "Matcha sweets in Asakusa"],
    activities: ["Walking across the busy Shibuya Crossing", "Exploring quirky youth fashion on Harajuku's Takeshita Street", "Experiencing immersive digital art at TeamLab Planets", "Enjoying night views from the Tokyo Metropolitan Government Building", "Strolling through Shinjuku Gyoen park", "Boat cruise along the Sumida River"],
    shopping: ["Ginza luxury department stores", "Takeshita Street shopping", "Akihabara Electric Town for electronics and anime goods", "Shibuya 109 fashion mall", "Nakamise shopping street outside Senso-ji"],
    culture: ["Senso-ji Temple (Tokyo's oldest)", "Meiji Shrine in Yoyogi Park", "Edo-Tokyo Museum", "Imperial Palace historic grounds", "Kanda Myojin Shrine"]
  },
  "kyoto": {
    name: "Kyoto", country: "Japan", state: "Kyoto",
    landmarks: ["Fushimi Inari Shrine", "Kinkaku-ji (Golden Pavilion)", "Kiyomizu-dera Temple", "Arashiyama Bamboo Grove", "Gion District", "Nijo Castle", "Ginkaku-ji (Silver Pavilion)", "Sanjusangendo Temple", "Kyoto Imperial Palace", "Philosopher's Path"],
    neighborhoods: ["Gion", "Higashiyama", "Arashiyama", "Pontocho Alley", "Kamigyo", "Shimogyo"],
    food: ["Kyoto Kaiseki dining", "Y豆腐 (Yudofu - tofu hotpot)", "Matcha green tea and sweets", "Kyoto-style ramen", "Nishiki Market street food stalls", "Yatsuhashi traditional sweet pastry"],
    activities: ["Walking through the thousands of vermilion torii gates at Fushimi Inari", "Strolling under towering bamboo stalks in Arashiyama Grove", "Viewing cherry blossoms along the Philosopher's Path", "Spotting geishas in the lantern-lit Gion district at dusk", "Walking along the wooden balcony of Kiyomizu-dera", "Tasting local street foods at Nishiki Market"],
    shopping: ["Nishiki Market (Kyoto's Kitchen)", "Shijo Street shopping malls", "Higashiyama historic streets for local pottery and fans", "Kyoto Craft Mart"],
    culture: ["Kinkaku-ji Temple coated in gold leaf", "Nijo Castle with squeaking nightingale floors", "Kiyomizu-dera UNESCO World Heritage site", "Sanjusangendo Temple with 1001 wooden statues", "Tenryu-ji Temple Zen gardens"]
  },
  "osaka": {
    name: "Osaka", country: "Japan", state: "Osaka",
    landmarks: ["Osaka Castle", "Dotonbori neon street", "Shinsaibashi-suji shopping arcade", "Universal Studios Japan", "Umeda Sky Building", "Tsutenkaku Tower", "Osaka Aquarium Kaiyukan", "Shitenno-ji Temple", "Sumiyoshi Taisha Shrine", "Kuromon Ichiba Market"],
    neighborhoods: ["Namba", "Umeda", "Shinsekai", "Dotonbori", "Tennoji", "Minami"],
    food: ["Takoyaki (octopus balls) at Dotonbori stalls", "Okonomiyaki (savory cabbage pancakes)", "Kushikatsu (deep fried skewers) in Shinsekai", "Osaka-style sushi", "Taiyaki fish-shaped waffle", "Fugu (pufferfish) soup"],
    activities: ["Taking photos with the giant Glico Running Man sign in Dotonbori", "Climbing to the top observation deck of Osaka Castle", "Walking through the Floating Garden Observatory at Umeda Sky Building", "Visiting the whale sharks at Osaka Aquarium Kaiyukan", "Exploring retro-themed Shinsekai streets", "Riding a canal boat along Dotonbori River"],
    shopping: ["Shinsaibashi-suji shopping arcade", "Kuromon Ichiba Market food stalls", "Grand Front Osaka shopping complex", "Den Den Town for electronics and games", "Orange Street for boutique fashion"],
    culture: ["Osaka Castle Museum", "Shitenno-ji Temple (one of Japan's oldest)", "Sumiyoshi Taisha unique architectural style shrine", "National Bunraku Theatre puppet shows"]
  },

  // === Thailand ===
  "bangkok": {
    name: "Bangkok", country: "Thailand", state: "Bangkok",
    landmarks: ["Grand Palace", "Wat Phra Kaew (Emerald Buddha)", "Wat Arun (Temple of Dawn)", "Wat Pho (Reclining Buddha)", "Chatuchak Weekend Market", "Jim Thompson House", "Lumpini Park", "Yaowarat Road (Chinatown)", "Mahanakhon SkyWalk", "Asiatique The Riverfront"],
    neighborhoods: ["Sukhumvit", "Khao San Road", "Siam Square", "Silom", "Yaowarat (Chinatown)", "Thonburi", "Banglamphu"],
    food: ["Pad Thai noodles at Thip Samai", "Spicy Tom Yum Goong soup", "Mango Sticky Rice dessert", "Thai Green Curry", "Som Tum (spicy papaya salad)", "Boat Noodles at Victory Monument", "Seafood dining in Chinatown Yaowarat"],
    activities: ["Taking a longtail boat ride along the Thonburi canals", "Watching the sunset light up the spires of Wat Arun", "Exploring the massive maze of Chatuchak Weekend Market", "Walking down the backpacker hub of Khao San Road at night", "Walking across the glass floor of Mahanakhon SkyWalk", "Getting a traditional Thai massage at Wat Pho school"],
    shopping: ["Chatuchak Weekend Market", "Siam Paragon luxury mall", "MBK Center for bargain electronics", "CentralWorld mega mall", "Pratunam Wholesale Market", "Yaowarat markets"],
    culture: ["Wat Pho (giant reclining Buddha)", "Wat Arun porcelain-encrusted pagoda", "Wat Phra Kaew royal temple", "Wat Saket (The Golden Mount temple)", "Erawan Shrine city worship altar"]
  },
  "phuket": {
    name: "Phuket", country: "Thailand", state: "Phuket",
    landmarks: ["Phuket Big Buddha", "Wat Chalong", "Promthep Cape", "Phuket Old Town", "Patong Beach and Bangla Road", "Kata Beach", "Karon Viewpoint", "Phang Nga Bay and James Bond Island", "Phi Phi Islands (accessible by boat)", "Freedom Beach"],
    neighborhoods: ["Patong", "Phuket Town", "Kata", "Karon", "Kamala", "Rawai", "Bang Tao"],
    food: ["Southern Thai Sour Curry (Kaeng Som)", "Fresh grilled lobster and prawns on the beach", "Hokkien Noodles in Old Phuket Town", "Roti pancake with sweet condensed milk", "Spicy Crab Curry with rice noodles"],
    activities: ["Hiring a scooter to watch the sunset at Promthep Cape", "Walking past colorful Sino-Portuguese houses in Phuket Old Town", "Taking a speedboat trip to Phi Phi Islands for snorkeling", "Taking a boat tour around the rock karsts of Phang Nga Bay", "Watching a cabaret show or Muay Thai match in Patong", "Visiting the giant Big Buddha statue on Nakkerd Hill"],
    shopping: ["Phuket Town Sunday Walking Street Market", "Jungceylon Shopping Mall in Patong", "Banzaan Fresh Market", "Chillva Night Market for street snacks"],
    culture: ["Wat Chalong temple complex", "Phuket Old Town shrines and museums", "Sino-Portuguese heritage buildings", "Thai Hua Museum detailing Chinese immigrant history"]
  },
  "chiang mai": {
    name: "Chiang Mai", country: "Thailand", state: "Chiang Mai",
    landmarks: ["Wat Phra That Doi Suthep", "Wat Chedi Luang", "Wat Phra Singh", "Chiang Mai Night Bazaar", "Doi Inthanon National Park", "Mae Sa Waterfall", "Elephant Nature Park", "Tha Phae Gate", "Wat Sri Suphan (Silver Temple)", "Huay Tung Tao Lake"],
    neighborhoods: ["Old City (walled)", "Nimmanhemin", "Night Bazaar area", "Lakeside", "Riverside"],
    food: ["Khao Soi (coconut curry noodle soup)", "Sai Oua (northern Thai herbal sausage)", "Nam Prik Ong chili dip", "Khanom Krok coconut puddings", "Street food at Chang Phueak Gate market"],
    activities: ["Climbing the golden stairs of Doi Suthep mountain temple", "Ethical elephant feeding at an elephant sanctuary", "Exploring ancient ruined pagodas in the walled Old City", "Taking a northern Thai cooking class", "Hiking to waterfalls in Doi Inthanon National Park", "Walking through the Sunday Walking Street market"],
    shopping: ["Chiang Mai Night Bazaar", "Sunday Walking Street (Rachadamnoen Road)", "Wualai Saturday Walking Street", "Nimmanhemin boutique shops"],
    culture: ["Wat Chedi Luang historic brick chedi", "Wat Phra Singh sacred temple", "Wat Sri Suphan clad in handcrafted silver", "Tha Phae Gate historic city walls", "Wiang Kum Kam underground ancient city"]
  },

  // === India ===
  "delhi": {
    name: "Delhi", country: "India", state: "Delhi",
    landmarks: ["Red Fort", "Qutub Minar", "Humayun's Tomb", "India Gate", "Lotus Temple", "Jama Masjid", "Akshardham Temple", "Chandni Chowk", "Lodi Gardens", "Rashtrapati Bhavan"],
    neighborhoods: ["Old Delhi", "Connaught Place (CP)", "Hauz Khas Village", "Greater Kailash", "Khan Market", "Karol Bagh", "Aerocity"],
    food: ["Butter Chicken at Moti Mahal", "Kebabs at Karim's near Jama Masjid", "Paranthas at Paranthe Wali Gali in Chandni Chowk", "Chole Bhature at Bengali Market", "Dahi Bhalla at Natraj", "Street food chaat in Old Delhi"],
    activities: ["Taking a rickshaw ride through the narrow lanes of Chandni Chowk", "Walking around India Gate and the war memorial at sunset", "Exploring the lush green paths and tombs of Lodi Gardens", "Stepping inside the peaceful marble Lotus Temple", "Touring the massive Qutub Minar brick minaret ruins", "Watching the light show at Akshardham Temple"],
    shopping: ["Dilli Haat INA for regional crafts", "Sarojini Nagar for bargain fashion shopping", "Janpath Market for jewelry", "Khan Market for upscale boutiques", "Chandni Chowk wholesale bazaars"],
    culture: ["Jama Masjid (one of India's largest mosques)", "Humayun's Tomb Mughal garden tomb", "National Museum", "National Gallery of Modern Art", "Gurudwara Bangla Sahib sikh temple and kitchen"]
  },
  "mumbai": {
    name: "Mumbai", country: "India", state: "Maharashtra",
    landmarks: ["Gateway of India", "Taj Mahal Palace Hotel", "Chhatrapati Shivaji Maharaj Terminus (CSMT)", "Marine Drive", "Haji Ali Dargah", "Siddhivinayak Temple", "Elephanta Caves", "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (Museum)", "Colaba Causeway", "Bandra-Worli Sea Link"],
    neighborhoods: ["Colaba", "Bandra", "Juhu", "Marine Drive", "Fort", "Kala Ghoda", "Worli"],
    food: ["Vada Pav at local street stalls", "Pav Bhaji at Sardar Refreshments", "Keema Ghotala at Café Leopold or Olympia", "Seafood at Mahesh Lunch Home or Trishna", "Irani Chai and Bun Maska at Yazdani Bakery", "Bhel Puri at Chowpatty Beach"],
    activities: ["Taking a ferry from Gateway of India to Elephanta Caves", "Driving across the architectural Bandra-Worli Sea Link", "Walking along Marine Drive (Queen's Necklace) at sunset", "Having a drink at the historic Café Leopold in Colaba", "Walking along Juhu Beach in the evening", "Viewing the gothic architecture of CSMT station"],
    shopping: ["Colaba Causeway bazaar for jewelry and clothing", "Linking Road in Bandra for bargain shopping", "Crawford Market for fresh goods and spices", "Fashion Street for clothes"],
    culture: ["Elephanta Caves UNESCO rock-cut cave temples", "CSMVS Museum art and history exhibits", "Kala Ghoda art district galleries", "Haji Ali Dargah mosque in the sea", "Siddhivinayak Ganesh Temple"]
  },
  "bengaluru": {
    name: "Bengaluru", country: "India", state: "Karnataka",
    landmarks: ["Bangalore Palace", "Lalbagh Botanical Garden", "Cubbon Park", "Vidhana Soudha", "Bull Temple", "Tipu Sultan's Summer Palace", "HAL Heritage Centre and Aerospace Museum", "Bannerghatta National Park", "Nandi Hills (accessible early morning)", "ISKCON Temple"],
    neighborhoods: ["Indiranagar", "Koramangala", "Jayanagar", "Malleswaram", "Whitefield", "Brigade Road", "MG Road"],
    food: ["Filter Coffee and Masala Dosa at Vidyarthi Bhavan or MTR", "Local craft beer at Toit in Indiranagar", "Traditional South Indian meals at Nagarjuna", "Filter Coffee and idli at Airlines Hotel garden cafe", "Mysore Pak sweet from Sri Krishna Sweets"],
    activities: ["Walking through the massive green canopy of Cubbon Park", "Viewing the glasshouse and fossil trees in Lalbagh Garden", "Drinking craft beers in the microbreweries of Indiranagar", "Touring the historic Bangalore Palace", "Watching the sunset from Nandi Hills", "Visiting the monolithic Bull Temple in Basavanagudi"],
    shopping: ["Commercial Street for apparel and fabrics", "Brigade Road and MG Road markets", "Chikpet bazaar for traditional sarees", "UB City mall for luxury brands"],
    culture: ["Vidhana Soudha imposing state legislature", "Tipu Sultan's wood-carved summer palace", "National Gallery of Modern Art", "Government Museum in Cubbon Park", "Visvesvaraya Industrial & Technological Museum"]
  },
  "chennai": {
    name: "Chennai", country: "India", state: "Tamil Nadu",
    landmarks: ["Marina Beach", "Kapaleeshwarar Temple", "San Thome Basilica", "Government Museum Chennai", "Fort St. George", "DakshinaChitra (heritage museum nearby)", "Guindy National Park", "Edward Elliot's Beach", "St. Thomas Mount", "Valluvar Kottam"],
    neighborhoods: ["Mylapore", "T. Nagar", "Adyar", "Besant Nagar (Bessie)", "Nungambakkam", "Georgetown"],
    food: ["Filter Coffee and Idli at Saravana Bhavan", "Crispy Masala Dosa at Murugan Idli Shop", "Traditional Tamil Meals on banana leaf", "Sundal street snack on Marina Beach", "Chettinad Pepper Chicken", "Biryani at local messes"],
    activities: ["Walking along Marina Beach (world's second longest urban beach) at dawn", "Exploring the colorful Dravidian architecture of Kapaleeshwarar Temple", "Visiting Fort St. George (first English fortress in India)", "Catching a classical Carnatic concert at Nungambakkam sabhas (December season)", "Watching sunset at Besant Nagar Beach", "Walking through the galleries of Government Museum"],
    shopping: ["T. Nagar Ranganathan Street for silks and gold", "Pondy Bazaar for apparel and sandals", "Express Avenue mall", "Saree shopping at Nalli or RmKV"],
    culture: ["Kapaleeshwarar Temple in Mylapore", "San Thome Basilica built over St. Thomas' tomb", "Fort St. George Museum", "Theosophical Society gardens in Adyar", "Kalakshetra Foundation for traditional dance"]
  },
  "kolkata": {
    name: "Kolkata", country: "India", state: "West Bengal",
    landmarks: ["Victoria Memorial", "Howrah Bridge", "Dakshineswar Kali Temple", "Belur Math", "Indian Museum", "Marble Palace", "St. Paul's Cathedral", "College Street Boi Para", "Science City", "Eden Gardens"],
    neighborhoods: ["Park Street", "College Street", "Kumartuli", "Salt Lake", "Gariahat", "Ballygunge", "Dalhousie Square"],
    food: ["Kolkata Kathi Roll at Nizam's", "Traditional Bengali fish curry and rice at Oh! Calcutta", "Rasgulla and Sandesh sweets from KC Das or Balaram Mullick", "Kolkata Mutton Biryani with potato", "Phuchka (street panipuri) at Gariahat", "Irani Tea at Flurys on Park Street"],
    activities: ["Walking across the iconic Howrah Bridge", "Taking a hand-pulled rickshaw or yellow cab ride", "Taking a boat ride on the Hooghly River at Babu Ghat", "Browsing rare books in the stalls of College Street", "Strolling around the gardens of Victoria Memorial", "Watching clay artisans sculpt idols in Kumartuli"],
    shopping: ["New Market (Hogg Market) bazaar", "Gariahat market for sarees and handicrafts", "Dakshinapan Shopping Center for state handlooms", "College Street book market"],
    culture: ["Victoria Memorial white marble gallery", "Indian Museum (Asia's oldest museum)", "Belur Math headquarters of Ramakrishna Mission", "Dakshineswar Kali Temple", "St. Paul's Cathedral gothic architecture", "Mother House (Mother Teresa's home)"]
  },
  "hyderabad": {
    name: "Hyderabad", country: "India", state: "Telangana",
    landmarks: ["Charminar", "Golconda Fort", "Salar Jung Museum", "Chowmahalla Palace", "Hussain Sagar Lake and Buddha Statue", "Birla Mandir", "Qutb Shahi Tombs", "Ramoji Film City", "Laad Bazaar", "Nehru Zoological Park"],
    neighborhoods: ["Old City", "Banjara Hills", "Jubilee Hills", "Gachibowli", "Secunderabad", "Begumpet"],
    food: ["Hyderabadi Dum Biryani at Paradise or Bawarchi", "Haleem at Pista House or Shah Ghouse", "Double ka Meetha dessert", "Irani Chai and Osmania Biscuits at Nimrah Cafe", "Spicy Andhra thali at local diners", "Pathar ka Gosht"],
    activities: ["Climbing the minarets of Charminar for old city views", "Listening to the echo effects in the chambers of Golconda Fort", "Taking a boat ride to the giant Buddha statue on Hussain Sagar Lake", "Drinking Irani Chai next to Charminar at Nimrah Cafe", "Viewing the extensive collection at Salar Jung Museum", "Exploring the illuminated Qutb Shahi Tombs at dusk"],
    shopping: ["Laad Bazaar for traditional lac bangles", "Perfume markets near Charminar", "Shilparamam Crafts Village in Hitech City", "Begum Bazaar wholesale market"],
    culture: ["Charminar central monument", "Chowmahalla Palace of the Nizams", "Qutb Shahi Tombs royal necropolis", "Birla Mandir white marble temple", "Golconda Fort citadel ruins"]
  },
  "jaipur": {
    name: "Jaipur", country: "India", state: "Rajasthan",
    landmarks: ["Hawa Mahal (Palace of Winds)", "Amer Fort", "City Palace", "Jantar Mantar Observatory", "Albert Hall Museum", "Jal Mahal (Water Palace)", "Nahargarh Fort", "Jaigarh Fort", "Galta Ji (Monkey Temple)", "Birla Mandir"],
    neighborhoods: ["Pink City (Old Walled)", "C-Scheme", "Malviya Nagar", "Raja Park", "Mansarovar"],
    food: ["Dal Baati Churma at Laxmi Mishthan Bhandar (LMB)", "Pyaaz Kachori at Rawat Mishthan Bhandar", "Traditional Rajasthani Thali at Chokhi Dhani", "Laal Maas (spicy mutton curry)", "Lassi in earthen cups at Lassiwala on MI Road"],
    activities: ["Exploring the grand ramparts of Amer Fort", "Taking photos of Hawa Mahal's pink honeycombed facade", "Watching the sunset over the Pink City from Nahargarh Fort", "Viewing the massive cannon at Jaigarh Fort", "Viewing astronomical instruments at Jantar Mantar", "Watching folk puppetry at City Palace gardens"],
    shopping: ["Johri Bazar for jewelry and gemstones", "Bapu Bazar for traditional block-print textiles", "Tripolia Bazar for lac bangles and ironware", "Kishanpole Bazar for wooden crafts"],
    culture: ["City Palace royal residence", "Jantar Mantar UNESCO observatory", "Albert Hall Indo-Saracenic museum", "Amer Fort Rajput architecture", "Galta Ji holy spring and temple"]
  },
  "udaipur": {
    name: "Udaipur", country: "India", state: "Rajasthan",
    landmarks: ["City Palace Udaipur", "Lake Pichola and Lake Palace", "Jag Mandir Palace", "Sajjangarh Monsoon Palace", "Saheliyon-ki-Bari (Courtyard of Maidens)", "Jagdish Temple", "Bagore Ki Haveli", "Fateh Sagar Lake", "Shilpgram (crafts village)", "Karni Mata Temple Ropeway"],
    neighborhoods: ["Lakeside (Old City)", "Fateh Sagar", "Hiran Magri", "Ambrai Ghat", "Sajjan Nagar"],
    food: ["Traditional Mewari Thali at Natraj", "Dinner at Ambrai Restaurant with lit City Palace view", "Kadhi Kachori street snack", "Mawad sweet lassi", "Spicy Lal Maas at lakeside bistros"],
    activities: ["Taking a boat cruise on Lake Pichola past Lake Palace", "Watching a traditional puppet and folk dance show at Bagore Ki Haveli", "Enjoying dinner overlooking the lit Palace from Ambrai Ghat", "Driving up to Monsoon Palace for sunset views over lakes", "Exploring the vast courtyards of City Palace", "Taking the ropeway to Karni Mata Temple"],
    shopping: ["Hathi Pol bazaar for Pichwai paintings", "Bada Bazar for leather bags and mojari shoes", "Rajasthali government handicraft emporium", "Lake Palace Road shops"],
    culture: ["City Palace architecture museum", "Jagdish Temple Indo-Aryan stone carvings", "Bagore Ki Haveli historical museum", "Shilpgram rural arts exhibit"]
  },
  "patna": {
    name: "Patna", country: "India", state: "Bihar",
    landmarks: ["Golghar", "Patna Museum", "Bihar Museum", "Kumhrar (Mauryan ruins)", "Takht Sri Patna Sahib (Gurudwara)", "Sanjay Gandhi Jaivik Udyan (Zoo)", "Gandhi Maidan", "Mahavir Mandir", "Gandhi Ghat", "Sabhyata Dwar"],
    neighborhoods: ["Kankarbagh", "Patliputra Colony", "Fraser Road", "Exhibition Road", "Rajendra Nagar", "Boring Road"],
    food: ["Traditional Litti Chokha at Maurya Lok complex", "Sweets like Anarsa, Tilkut, and Khaja", "Bihari Fish Curry", "Makhana kheer", "Sattu sharbat drink"],
    activities: ["Walking up the circular stairs of the beehive-shaped Golghar", "Viewing ancient Mauryan stone sculptures at Patna Museum", "Taking a boat cruise on the Ganges from Gandhi Ghat", "Paying respects at the birthplace of Guru Gobind Singh at Patna Sahib", "Strolling in the modern galleries of Bihar Museum", "Watching the evening Ganges Aarti at Gandhi Ghat"],
    shopping: ["Maurya Lok shopping complex", "Hathwa Market for sarees", "Patna Market for local goods", "Khaitan Market"],
    culture: ["Takht Sri Patna Sahib Gurudwara", "Kumhrar ancient ruins of Pataliputra", "Bihar Museum cultural heritage displays", "Patna Museum collections", "Mahavir Mandir next to railway station"]
  },
  "gaya": {
    name: "Gaya", country: "India", state: "Bihar",
    landmarks: ["Vishnupad Temple", "Phalgu River Ghats", "Mangla Gauri Temple", "Dungeshwari Cave Temples", "Ramshila Hill", "Pretshila Hill", "Brahmayoni Hill"],
    neighborhoods: ["Gaya Town", "Kotwali", "Gol Bagicha", "Ramna", "Phalgu Waterfront"],
    food: ["Famous Gaya Tilkut sweet made of sesame", "Anarsa sweet", "Kesaria peda", "Traditional North Indian thali", "Sattu paratha with local pickles"],
    activities: ["Walking down the Phalgu River ghats for rituals", "Climbing the steps to Vishnupad Temple to see Vishnu's footprint", "Hiking up Brahmayoni Hill for views of Gaya town", "Exploring the ancient cave temples at Dungeshwari Hills", "Visiting the hill shrine of Mangla Gauri"],
    shopping: ["GB Road markets", "Tilkut shops near station", "Gaya local bazaars for brassware"],
    culture: ["Vishnupad Temple (originally built by Rani Ahilyabai Holkar)", "Mangla Gauri historic shaktipeeth temple", "Phalgu River pilgrimage ghats", "Ramshila Hill mythological ruins"]
  },
  "bodhgaya": {
    name: "Bodhgaya", country: "India", state: "Bihar",
    landmarks: ["Mahabodhi Temple", "The Bodhi Tree", "Great Buddha Statue (80-foot)", "Thai Monastery", "Royal Bhutan Monastery", "Japanese Nippon Temple", "Tergar Monastery", "Archaeological Museum Bodhgaya", "Muchalinda Lake", "Root Institute"],
    neighborhoods: ["Temple Area", "Lal Bahadur Shastri Path", "Lakeside", "Monastery road", "Bodhgaya Bazaar"],
    food: ["Vegetarian lunch at Root Institute Cafe", "Tibetan momos and thukpa at refugee stalls", "Thai and Chinese cuisine at local diners", "Local sweet malpua", "Herbal teas at Zen cafes"],
    activities: ["Meditating near the sacred Bodhi Tree behind Mahabodhi Temple", "Taking photos in front of the giant 80-foot Great Buddha Statue", "Strolling through the beautiful international monasteries", "Exploring ancient Buddhist relics at the Archaeological Museum", "Walking around the peaceful Muchalinda Lake", "Attending a chanting ceremony at Tergar Monastery"],
    shopping: ["Tibetan Refugee Market for woolens and prayer flags", "Mahabodhi Temple Road souvenir stalls", "Bookshops specializing in Buddhism"],
    culture: ["Mahabodhi Temple (UNESCO World Heritage Site)", "The Bodhi Tree where Buddha attained enlightenment", "International Buddhist Monasteries of Thai, Bhutan, and Japan", "Muchalinda Lake naga statue"]
  },
  "nalanda": {
    name: "Nalanda", country: "India", state: "Bihar",
    landmarks: ["Nalanda University Ruins", "Nalanda Archaeological Museum", "Hiuen Tsang Memorial Hall", "Kundalpur Digambar Temple", "Surajpur Sun Temple", "Nalanda Multimedia Museum", "Nava Nalanda Mahavihara"],
    neighborhoods: ["Ruins Area", "Nalanda Village", "Kundalpur", "Surajpur"],
    food: ["Traditional Bihari thali", "Sweets like Khaja from Silao nearby", "Litti Chokha at local garden restaurants", "Fresh sugarcane juice"],
    activities: ["Walking through the vast excavated ruins of ancient Nalanda University", "Exploring historical stone seals and plaques at the Archaeological Museum", "Visiting the pagoda-style Hiuen Tsang Memorial Hall", "Visiting the giant Kundalpur Digambar Jain Temple", "Trying local Silao Khaja sweet pastry"],
    shopping: ["Nalanda Ruins gate souvenir stalls", "Silao village sweet shops for Khaja"],
    culture: ["Nalanda Mahavihara ancient university excavations", "Hiuen Tsang Memorial Hall cultural displays", "Surajpur historic Sun Temple and lake", "Kundalpur historic Jain pilgrimage site"]
  },
  "rajgir": {
    name: "Rajgir", country: "India", state: "Bihar",
    landmarks: ["Vishwa Shanti Stupa (Peace Pagoda)", "Griddhakuta (Gridhra-kuta / Vulture's Peak)", "Rajgir Ropeway", "Hot Springs (Brahmakund)", "Saptaparni Cave", "Cyclopean Wall of Rajgir", "Bimbisara Jail ruins", "Venu Vana (Bamboo Grove)", "Ghora Katora Lake"],
    neighborhoods: ["Rajgir Town", "Kund Area", "Lakeside", "Ropeway foothills", "Venu Vana surroundings"],
    food: ["Silao Khaja sweet pastry", "Vegetarian thali at ashram canteens", "Fresh coconut water near hot springs", "Local roasted maize (bhutta)"],
    activities: ["Riding the scenic single-chair ropeway up Ratnagiri Hill", "Taking a holy bath in the warm waters of Brahmakund hot springs", "Hiking up to Vulture's Peak to see Buddhist prayer flags", "Taking a horse carriage (tonga) ride to Ghora Katora Lake", "Walking past the ancient stone blocks of the 40km Cyclopean Wall", "Exploring the Saptaparni Cave where the first Buddhist council met"],
    shopping: ["Ropeway base local crafts market", "Rajgir main bazaar for wooden toys and stone crafts"],
    culture: ["Vishwa Shanti Stupa Japanese architecture", "Saptaparni Cave historic assembly site", "Bimbisara Jail ancient ruins", "Venu Vana bamboo grove garden", "Cyclopean Wall ancient military fortification"]
  }
};

// Add remaining cities directly
const extraCities = {
  // === Rest of UK ===
  "glasgow": {
    name: "Glasgow", country: "United Kingdom", state: "Scotland",
    landmarks: ["Kelvingrove Art Gallery and Museum", "Glasgow Cathedral", "Riverside Museum", "Glasgow Botanic Gardens", "People's Palace", "Necropolis", "Glasgow Science Centre", "George Square"],
    neighborhoods: ["West End", "Merchant City", "Finnieston", "Southside", "Hillhead"],
    food: ["Haggis bon-bons", "Scottish Salmon", "Traditional Cullen Skink", "Tunnock's Teacakes", "Craft beer in Finnieston", "Deep fried Mars bars"],
    activities: ["Exploring Kelvingrove Art Gallery", "Strolling the Botanic Gardens glasshouses", "Walking through the hilltop Necropolis cemetery", "Exploring Clyde riverfront museum", "Attending live music at King Tut's"],
    shopping: ["Buchanan Street Style Mile", "The Barras Weekend Market", "West End vintage clothing shops"],
    culture: ["Glasgow Cathedral medieval crypt", "Mackintosh School of Art architecture", "Gallery of Modern Art"]
  },
  "inverness": {
    name: "Inverness", country: "United Kingdom", state: "Scotland",
    landmarks: ["Inverness Castle", "Loch Ness Urquhart Castle", "Ness Islands", "Culloden Battlefield", "Clava Cairns", "Caledonian Canal", "Leakey's Bookshop"],
    neighborhoods: ["Riverside", "Crown", "Haugh", "Clachnaharry"],
    food: ["River Ness Salmon", "Highland venison", "Traditional oatcakes", "Single malt whisky", "Craft gin"],
    activities: ["Taking a boat cruise on Loch Ness to search for Nessie", "Walking the Ness Islands footbridges", "Touring the historic Culloden Battlefield", "Browsing inside Leakey's second-hand bookshop", "Exploring the standing stones of Clava Cairns"],
    shopping: ["Victorian Market independent shops", "Eastgate Shopping Centre", "Kiltmakers shops"],
    culture: ["Urquhart Castle medieval ruins", "Inverness Museum and Art Gallery", "Traditional music at local pubs"]
  },
  "isle of skye": {
    name: "Isle of Skye", country: "United Kingdom", state: "Scotland",
    landmarks: ["Old Man of Storr", "Quiraing landslide", "Fairy Pools", "Neist Point Lighthouse", "Dunvegan Castle", "Talisker Distillery", "Portree Harbor", "Kilt Rock"],
    neighborhoods: ["Portree", "Broadford", "Dunvegan", "Carbost", "Uig"],
    food: ["Fresh Skye oysters and scallops", "Talisker single malt whisky", "Local venison burgers", "Crab sandwiches"],
    activities: ["Hiking to the Old Man of Storr pinnacle", "Swimming in the clear waters of Fairy Pools", "Hiking the dramatic Quiraing ridge", "Walking to Neist Point Lighthouse at sunset", "Taking a whisky tasting at Talisker"],
    shopping: ["Portree colorful harbor craft shops", "Skye Weavers workshop", "Uig pottery studios"],
    culture: ["Dunvegan Castle Clan MacLeod seat", "Skye Museum of Island Life", "Flora Macdonald monument"]
  },
  "aberdeen": {
    name: "Aberdeen", country: "United Kingdom", state: "Scotland",
    landmarks: ["Marischal College", "Duthie Park Winter Gardens", "Footdee fishing village", "Aberdeen Art Gallery", "St. Machar's Cathedral", "Aberdeen Beach esplanade"],
    neighborhoods: ["Old Aberdeen", "Footdee", "Rosemount", "West End"],
    food: ["Aberdeen Angus beef steak", "Butteries local flaky pastry", "Fresh cod fish and chips", "Craft beers"],
    activities: ["Exploring the tiny cottages of Footdee", "Walking the granite courtyards of Old Aberdeen", "Strolling in the Winter Gardens glasshouses", "Walking Aberdeen beach esplanade", "Visiting Marischal College"],
    shopping: ["Union Street", "Union Square Mall", "Belmont Street farmers market"],
    culture: ["Aberdeen Maritime Museum", "St. Machar's Cathedral twin towers", "Aberdeen Art Gallery"]
  },

  // === Rest of US ===
  "los angeles": {
    name: "Los Angeles", country: "United States", state: "California",
    landmarks: ["Hollywood Sign", "Griffith Observatory", "Santa Monica Pier", "Getty Center", "LACMA Museum", "Universal Studios Hollywood", "Rodeo Drive", "Venice Beach Boardwalk"],
    neighborhoods: ["Hollywood", "Beverly Hills", "Santa Monica", "Venice Beach", "Downtown LA", "Silver Lake"],
    food: ["Street tacos from local trucks", "In-N-Out double-double burger", "French dip sandwich at Philippe's", "Koreatown BBQ", "Avocado toast"],
    activities: ["Hiking to Griffith Observatory for skyline views", "Walking along Santa Monica Pier", "Strolling past Muscle Beach in Venice", "Finding stars on the Hollywood Walk of Fame", "Visiting the Getty Center gardens"],
    shopping: ["Rodeo Drive luxury stores", "Abbot Kinney Blvd boutiques", "The Grove outdoor mall"],
    culture: ["Getty Center art collections", "LACMA outdoor lights installation", "Broad Contemporary Art Museum"]
  },
  "san francisco": {
    name: "San Francisco", country: "United States", state: "California",
    landmarks: ["Golden Gate Bridge", "Alcatraz Island", "Fisherman's Wharf", "Lombard Street", "Coit Tower", "Ghirardelli Square", "Painted Ladies", "Palace of Fine Arts", "Golden Gate Park"],
    neighborhoods: ["Chinatown", "Mission District", "Castro", "Haight-Ashbury", "North Beach", "Marina"],
    food: ["Clam chowder in sourdough bowl", "Mission Burrito at local taquerias", "Dungeness Crab", "Irish Coffee at Buena Vista", "Dim sum"],
    activities: ["Riding a cable car up the hills", "Taking a ferry tour of Alcatraz prison", "Walking across the Golden Gate Bridge", "Strolling down Lombard Street", "Watching sea lions at Pier 39"],
    shopping: ["Union Square shopping", "Ferry Building Marketplace", "Haight Street vintage shops"],
    culture: ["SFMOMA art exhibits", "De Young Fine Arts Museum", "Palace of Fine Arts historic structures"]
  },
  "san diego": {
    name: "San Diego", country: "United States", state: "California",
    landmarks: ["San Diego Zoo", "Balboa Park", "USS Midway Museum", "Hotel del Coronado", "La Jolla Cove", "Sunset Cliffs", "Gaslamp Quarter"],
    neighborhoods: ["Gaslamp Quarter", "La Jolla", "Little Italy", "Coronado", "North Park", "Old Town"],
    food: ["Baja fish tacos", "California Burrito with fries inside", "Fresh seafood in La Jolla", "Craft beers"],
    activities: ["Watching sea lions at La Jolla Cove", "Exploring aircraft carrier USS Midway", "Strolling the Spanish gardens of Balboa Park", "Watching sunset at Sunset Cliffs", "Ferry to Coronado Island"],
    shopping: ["Seaport Village shops", "Gaslamp Quarter boutiques", "Little Italy farmers market"],
    culture: ["Old Town historic adobe buildings", "San Diego Museum of Art", "USS Midway exhibits"]
  },
  "yosemite valley": {
    name: "Yosemite Valley", country: "United States", state: "California",
    landmarks: ["Half Dome", "El Capitan", "Yosemite Falls", "Bridalveil Fall", "Tunnel View", "Glacier Point", "Mirror Lake"],
    neighborhoods: ["Yosemite Village", "Curry Village", "Wawona", "Tuolumne Meadows"],
    food: ["Curry Village buffet", "Ahwahnee Hotel dining room", "Trail mix & campfire snacks", "Local craft beers"],
    activities: ["Hiking Mist Trail to waterfalls", "Photographing scenery at Tunnel View", "Strolling to Mirror Lake", "Watching rock climbers on El Capitan", "Watching sunset over Half Dome from Sentinel Bridge"],
    shopping: ["Yosemite Village Store", "Ansel Adams Gallery for photo prints"],
    culture: ["Yosemite Museum and Indian Exhibit", "Ahwahnee Hotel architecture", "Ansel Adams historical photos"]
  },
  "sacramento": {
    name: "Sacramento", country: "United States", state: "California",
    landmarks: ["California State Capitol", "Old Sacramento Waterfront", "Tower Bridge", "Railroad Museum", "Crocker Art Museum", "Sutter's Fort"],
    neighborhoods: ["Old Sacramento", "Midtown", "Downtown", "Land Park"],
    food: ["Farm-to-fork fresh dining", "Midtown craft beers", "Local Napa and Lodi wines", "Gourmet burgers"],
    activities: ["Touring the State Capitol building and gardens", "Exploring gold rush buildings in Old Sac", "Visiting Sutter's Fort historic park", "Strolling the Sacramento River bike path"],
    shopping: ["Old Sacramento waterfront stores", "Midtown weekly farmers market"],
    culture: ["Crocker Art Museum collections", "State Railroad Museum historic trains", "Sacramento History Museum"]
  },

  // === Rest of France ===
  "nice": {
    name: "Nice", country: "France", state: "Provence-Alpes-Côte d'Azur",
    landmarks: ["Promenade des Anglais", "Castle Hill", "Cours Saleya Market", "Nice Cathedral", "Marc Chagall Museum", "Matisse Museum", "Place Masséna"],
    neighborhoods: ["Vieux Nice (Old Town)", "Port District", "Cimiez", "Carré d'Or"],
    food: ["Salade Niçoise", "Socca chickpea pancake", "Pan Bagnat sandwich", "Pissaladière onion tart", "Fresh seafood"],
    activities: ["Walking the Promenade des Anglais", "Climbing Castle Hill for bay views", "Browsing Cours Saleya flower market", "Visiting the Marc Chagall Museum", "Strolling past yachts in Port Lympia"],
    shopping: ["Cours Saleya Market", "Avenue Jean Médecin stores", "Vieux Nice boutiques"],
    culture: ["Nice Cathedral interior", "Matisse Museum in Cimiez", "Marc Chagall paintings collection"]
  },
  "lyon": {
    name: "Lyon", country: "France", state: "Auvergne-Rhône-Alpes",
    landmarks: ["Notre-Dame de Fourvière Basilica", "Ancient Theatre of Fourvière", "Place Bellecour", "Parc de la Tête d'Or", "Musée des Confluences", "Traboules of Lyon"],
    neighborhoods: ["Vieux Lyon (Old Town)", "La Presqu'île", "La Croix-Rousse", "Confluence"],
    food: ["Quenelles de brochet", "Saucisson de Lyon", "Tarte aux pralines", "Beaujolais and Rhône wines", "Dining at traditional Bouchon Lyonnais"],
    activities: ["Walking through hidden Traboules passageways", "Climbing Fourvière Hill for city views", "Rowing a boat in Tête d'Or lake", "Having lunch at Les Halles Paul Bocuse food market"],
    shopping: ["Rue de la République shopping", "Les Halles de Lyon Paul Bocuse food stalls"],
    culture: ["Museum of Fine Arts", "Lumière Museum of cinema history", "Fourvière Roman amphitheater ruins"]
  },

  // === Rest of Italy ===
  "florence": {
    name: "Florence", country: "Italy", state: "Tuscany",
    landmarks: ["Florence Cathedral (Duomo)", "Ponte Vecchio bridge", "Uffizi Gallery", "Accademia Gallery David", "Palazzo Vecchio", "Boboli Gardens", "Piazzale Michelangelo"],
    neighborhoods: ["Santo Spirito", "San Giovanni", "Santa Maria Novella", "San Niccolò"],
    food: ["Florentine steak", "Ribollita vegetable soup", "Schacciata sandwich at All'Antico Vinaio", "Tuscan Chianti wine"],
    activities: ["Climbing the Duomo dome", "Walking across Ponte Vecchio bridge", "Viewing Botticelli's works at Uffizi", "Sunset over Florence from Piazzale Michelangelo", "Strolling Boboli Gardens"],
    shopping: ["San Lorenzo leather market", "Mercato Centrale food stalls", "Via de' Tornabuoni fashion stores"],
    culture: ["Accademia Gallery David statue", "Basilica of Santa Croce tombs", "Medici Chapels"]
  },
  "venice": {
    name: "Venice", country: "Italy", state: "Veneto",
    landmarks: ["St. Mark's Basilica", "St. Mark's Square", "Doge's Palace", "Rialto Bridge", "Grand Canal", "Bridge of Sighs", "Murano Island"],
    neighborhoods: ["Cannaregio", "San Marco", "San Polo", "Dorsoduro", "Castello"],
    food: ["Cicchetti Venetian tapas at bacari bars", "Squid ink risotto", "Bellini cocktail at Harry's Bar", "Fritto Misto seafood"],
    activities: ["Taking a gondola ride along side canals", "Cruising the Grand Canal on water bus", "Visiting chambers of Doge's Palace", "Watching a glassblowing show on Murano Island"],
    shopping: ["Rialto Market food stalls", "Murano glass workshops", "Venetian mask artisan boutiques"],
    culture: ["St. Mark's Basilica mosaics", "Doge's Palace history museum", "Santa Maria della Salute basilica"]
  },

  // === Rest of Japan ===
  "kyoto": {
    name: "Kyoto", country: "Japan", state: "Kyoto",
    landmarks: ["Fushimi Inari Shrine", "Kinkaku-ji (Golden Pavilion)", "Kiyomizu-dera Temple", "Arashiyama Bamboo Grove", "Gion District", "Nijo Castle", "Philosopher's Path"],
    neighborhoods: ["Gion", "Higashiyama", "Arashiyama", "Pontocho Alley"],
    food: ["Kaiseki fine dining", "Yudofu tofu hotpot", "Matcha green tea sweets", "Nishiki Market street foods", "Yatsuhashi sweet pastry"],
    activities: ["Walking through vermilion torii gates at Fushimi Inari", "Strolling Arashiyama Bamboo Grove", "Spotting geishas in Gion at dusk", "Walking Kiyomizu-dera balcony", "Tasting foods at Nishiki Market"],
    shopping: ["Nishiki Market", "Shijo Street malls", "Higashiyama historic streets for local pottery"],
    culture: ["Kinkaku-ji golden pagoda", "Nijo Castle nightingale squeaking floors", "Kiyomizu-dera temple architecture"]
  },
  "osaka": {
    name: "Osaka", country: "Japan", state: "Osaka",
    landmarks: ["Osaka Castle", "Dotonbori street", "Shinsaibashi arcade", "Universal Studios Japan", "Umeda Sky Building", "Tsutenkaku Tower", "Osaka Aquarium"],
    neighborhoods: ["Namba", "Umeda", "Shinsekai", "Dotonbori"],
    food: ["Takoyaki octopus balls", "Okonomiyaki cabbage pancakes", "Kushikatsu skewers in Shinsekai", "Street food at Kuromon Market"],
    activities: ["Photos with Glico Running Man in Dotonbori", "Climbing Osaka Castle tower", "Skydeck views from Umeda Sky Building", "Exploring retro streets of Shinsekai", "Dotonbori River canal cruise"],
    shopping: ["Shinsaibashi-suji shopping arcade", "Kuromon Ichiba Market stalls", "Orange Street fashion shops"],
    culture: ["Osaka Castle Museum", "Shitenno-ji Temple", "Sumiyoshi Taisha Shrine heritage structures"]
  },

  // === Rest of India (State Specific Targets) ===
  // Himachal Pradesh Cities
  "shimla": {
    name: "Shimla", country: "India", state: "Himachal Pradesh",
    landmarks: ["The Ridge", "Jakhoo Temple (Monkey Temple)", "Christ Church", "Mall Road Shimla", "Viceregal Lodge (Indian Institute of Advanced Study)", "Kalka-Shimla Toy Train", "Tara Devi Temple", "Kufri (nearby)"],
    neighborhoods: ["Mall Road", "The Ridge area", "Lakkar Bazar", "Chotta Shimla", "Summer Hill"],
    food: ["Traditional Himachali Siddu with ghee", "Chha Gosht spicy meat", "Local fruit wines", "Cafes on Mall Road like Cafe Shimla Times", "Warm Tibetan momos"],
    activities: ["Riding the UNESCO Kalka-Shimla Toy Train through tunnels", "Hiking up Jakhoo Hill to see the giant Hanuman statue", "Strolling along the pedestrian-only Mall Road and Ridge", "Touring the historic Viceregal Lodge", "Watching the sunset from Scandal Point"],
    shopping: ["Lakkar Bazar for wooden handicrafts and toys", "Mall Road shops for woolens", "Tibetan Market for winter wear"],
    culture: ["Christ Church Elizabethan architecture", "Viceregal Lodge colonial history", "Tara Devi hilltop temple", "State Museum detailing Himachali art"]
  },
  "manali": {
    name: "Manali", country: "India", state: "Himachal Pradesh",
    landmarks: ["Hadimba Temple", "Solang Valley", "Rohtang Pass (nearby)", "Jogini Waterfalls", "Manu Temple", "Vashisht Hot Water Springs", "Van Vihar National Park", "Tibetan Monasteries"],
    neighborhoods: ["Old Manali", "New Manali Mall Road", "Vashisht Village", "Solang Village", "Aleo"],
    food: ["Fresh river Trout fish", "Local Siddu pastry", "Tibetan Thukpa noodle soup", "Apples from orchards", "Dining at Old Manali cafes like Cafe 1947 or Dylan's Coffee House"],
    activities: ["Visiting the wooden Hadimba Temple inside pine forest", "Adventure sports like paragliding in Solang Valley", "Trekking to the scenic Jogini Waterfalls", "Bathing in Vashisht sulfur hot springs", "Relaxing by the rushing Beas River in Old Manali", "Day trip driving to the snow-covered Rohtang Pass"],
    shopping: ["Mall Road market for shawls and rugs", "Old Manali streets for bohemian clothes and dreamcatchers", "Tibetan bazaar for handicrafts"],
    culture: ["Hadimba Temple wooden pagoda architecture", "Manu Temple dedicated to sage Manu", "Nyingmapa Buddhist Monastery and prayer wheels"]
  },
  "dharamshala": {
    name: "Dharamshala", country: "India", state: "Himachal Pradesh",
    landmarks: ["Tsuglagkhang Complex (Dalai Lama Temple)", "Bhagsunag Waterfall", "Bhagsunag Temple", "Dharamshala Cricket Stadium (HPCA)", "Kangra Art Museum", "St. John in the Wilderness Church", "Triund Hill trek trail"],
    neighborhoods: ["McLeod Ganj (Little Lhasa)", "Dharamkot hipster village", "Bhagsunag", "Naddi viewpoint", "Kotwali Bazar"],
    food: ["Tibetan Momos and Thukpa", "Butter tea", "Thali at Tibet Kitchen", "Local Himachali dishes", "Pancakes and health food in Dharamkot cafes", "Bakery goods at Illiterati Cafe"],
    activities: ["Doing the Kora spiritual walk around Dalai Lama Temple", "Trekking up to Triund Hill for views of Dhauladhar range", "Watching a cricket match or touring the HPCA stadium", "Walking to the cold pool of Bhagsunag Waterfall", "Visiting the gothic St. John in the Wilderness Church in the forest"],
    shopping: ["McLeod Ganj market for singing bowls and prayer wheels", "Kotwali Bazar local shops", "Tibetan handicraft center shop"],
    culture: ["Tsuglagkhang Temple (seat of Dalai Lama)", "St. John Church colonial architecture", "Norbulingka Institute preserving Tibetan culture"]
  },
  "dalhousie": {
    name: "Dalhousie", country: "India", state: "Himachal Pradesh",
    landmarks: ["Khajjiar Lake (Mini Switzerland)", "Dainkund Peak", "Panchpula waterfall", "Kalatop Wildlife Sanctuary", "St. John's Church", "St. Patrick's Church", "Subhash Baoli"],
    neighborhoods: ["Gandhi Chowk", "Subhash Chowk", "Khajjiar valley", "Panchpula area", "Bakrota Hills"],
    food: ["Traditional North Indian thali", "Tibetan street foods", "Local apples and plums", "Hot tea with maggi at viewpoints", "Chinese and continental dishes at Mall Road diners"],
    activities: ["Strolling the pine-rimmed meadows of Khajjiar Lake", "Hiking to Dainkund Peak for 360-degree mountain views", "Walking past pine trails in Kalatop Wildlife Sanctuary", "Viewing the monument of Sardar Ajit Singh at Panchpula", "Strolling between Gandhi Chowk and Subhash Chowk"],
    shopping: ["Gandhi Chowk Tibetan market for shawls", "Himachal Handloom Industry Emporium", "Local woolens shops"],
    culture: ["St. John's Church oldest chapel in town", "St. Patrick's Church stone structure", "Bhuri Singh Museum in nearby Chamba"]
  },
  "kasol": {
    name: "Kasol", country: "India", state: "Himachal Pradesh",
    landmarks: ["Parvati River", "Chalal Village trail", "Manikaran Sahib Gurudwara and Hot Springs", "Tosh Village trail", "Kheerganga Trek trail", "Katagla", "Kasol Temple"],
    neighborhoods: ["Kasol Bazaar", "Chalal pine woods", "Manikaran holy town", "Tosh hillside village", "Barsheni road"],
    food: ["Israeli Shakshuka, Hummus, and Pita", "Local river trout fish", "Tibetan momos", "German bakery pastries at Evergreen Cafe", "Hot instant noodles (Maggi) along trails", "Local apples"],
    activities: ["Hiking along the roaring Parvati River to Chalal village", "Bathing in the naturally boiling water springs at Manikaran Gurudwara", "Hiking the steep stone trails of Tosh village", "Trekking to Kheerganga hot springs", "Sitting on river boulders listening to the water", "Chilling at riverside music cafes"],
    shopping: ["Kasol hippie market for hemp bags, dreamcatchers, and crystals", "Local shawl and woolen shops", "Tosh local artisan stalls"],
    culture: ["Manikaran Sahib historic Gurudwara and temple complex", "Traditional wooden temples of Tosh and Chalal villages", "Local devta festivals in Parvati Valley"]
  },

  // Rajasthan Cities
  "jodhpur": {
    name: "Jodhpur", country: "India", state: "Rajasthan",
    landmarks: ["Mehrangarh Fort", "Jaswant Thada", "Umaid Bhawan Palace", "Ghanta Ghar (Clock Tower)", "Toorji Ka Jhalra (Stepwell)", "Mandore Gardens", "Kaylana Lake", "Rao Jodha Desert Rock Park"],
    neighborhoods: ["Blue City (Old Jodhpur)", "Sardar Market", "Shastri Nagar", "Ratanada", "Sardarpura"],
    food: ["Famous Mawa Kachori sweet from Janta Sweet Home", "Mirchi Bada spicy snack", "Pyaaz Kachori", "Lal Maas spicy mutton", "Makhania Lassi (saffron lassi) at clock tower"],
    activities: ["Exploring the massive Mehrangarh Fort towering over the blue city", "Walking past the blue-painted houses in the old town lanes", "Visiting the white marble memorial of Jaswant Thada", "Stepping down the stone steps of Toorji Ka Jhalra stepwell", "Taking a zip-line tour over the fort walls (Flying Fox Jodhpur)", "Touring the museum at Umaid Bhawan Palace"],
    shopping: ["Sardar Market around the clock tower for spices", "Mochi Bazar for embroidered leather shoes (jotis)", "Tripolia Bazar for handicrafts and antiques", "Nai Sarak bandhani fabrics"],
    culture: ["Mehrangarh Fort royal museum", "Jaswant Thada cenotaph architecture", "Mandore Gardens historic cenotaph ruins", "Umaid Bhawan Palace Art Deco architecture"]
  },
  "jaisalmer": {
    name: "Jaisalmer", country: "India", state: "Rajasthan",
    landmarks: ["Jaisalmer Fort (Golden Fort)", "Sam Sand Dunes", "Patwon Ki Haveli", "Nathmal Ki Haveli", "Salim Singh Ki Haveli", "Gadisar Lake", "Kuldhara Abandoned Village", "Tanot Mata Temple (nearby)", "Bada Bagh cenotaphs"],
    neighborhoods: ["Fort Walled Area", "Manak Chowk", "Sam Desert Area", "Gadisar Lake area", "Kotsa road"],
    food: ["Rajasthani Ker Sangri vegetable dish", "Dal Baati Churma", "Spicy mutton curry", "Local sweets like Ghotua laddu", "Bhang Lassi (authorized local shop)"],
    activities: ["Walking inside the living sandcastle streets of Jaisalmer Fort", "Riding a camel through the Sam Sand Dunes at sunset", "Camping overnight in desert tents with folk music and dancing", "Boating on the historic Gadisar Lake surrounded by shrines", "Exploring the haunted ruins of Kuldhara village", "Photographing the yellow sandstone cenotaphs at Bada Bagh"],
    shopping: ["Sadar Bazar inside fort for leather goods and rugs", "Pansari Bazar for local fabrics and blankets", "Manak Chowk handicraft stalls"],
    culture: ["Jaisalmer Fort living heritage complex", "Jain Temples inside the fort with intricate carvings", "Patwon Ki Haveli architecture museum", "Bada Bagh royal cenotaphs"]
  },
  "pushkar": {
    name: "Pushkar", country: "India", state: "Rajasthan",
    landmarks: ["Brahma Temple", "Pushkar Lake and Ghats", "Savitri Temple (hilltop)", "Varaha Temple", "Rangji Temple", "Pap Mochini Temple", "Pushkar Camel Fair Grounds"],
    neighborhoods: ["Lake Ghats Area", "Main Bazaar", "Chhoti Basti", "Bari Basti", "Desert camps area"],
    food: ["Famous Pushkar Rabdi and Malpua sweet at Halwai Lane", "Falafel wraps at local street stalls (Ganga Falafel)", "Traditional Rajasthani vegetarian thali", "Lassi in clay cups", "Kachori and samosas"],
    activities: ["Watching the morning prayers and taking a walk around Pushkar Lake ghats", "Riding the cable car or hiking up Ratnagiri Hill to Savitri Temple for sunrise views", "Visiting the rare Lord Brahma Temple (14th century)", "Watching the evening aarti prayer ceremony at Varaha Ghat", "Taking a camel cart ride into the surrounding desert dunes"],
    shopping: ["Pushkar Main Bazaar for silver jewelry, leather bags, and colorful skirts", "Sarafa Bazar for local paintings and fabrics", "Local incense and rosewater shops"],
    culture: ["Brahma Temple (one of the world's few active Brahma shrines)", "Pushkar Lake sacred pilgrimage site with 52 bathing ghats", "Varaha Temple ancient stone structure", "Savitri Temple hilltop shrine"]
  },

  // Goa Cities
  "panaji": {
    name: "Panaji", country: "India", state: "Goa",
    landmarks: ["Our Lady of the Immaculate Conception Church", "Fontainhas Latin Quarter", "Mandovi River Promenade", "Basilic of Bom Jesus (nearby in Old Goa)", "Se Cathedral (Old Goa)", "Goa State Museum", "Miramar Beach"],
    neighborhoods: ["Fontainhas", "Campal", "Altinho", "Miramar", "Panjim Market area"],
    food: ["Goan Fish Thali at Mum's Kitchen or Ritz Classic", "Pork Vindaloo", "Chicken Xacuti", "Bebinca dessert", "Local cashew Feni", "Seafood rissois"],
    activities: ["Walking through the colorful Portuguese houses of Fontainhas Latin Quarter", "Taking a sunset river cruise on the Mandovi River", "Visiting the white baroque church on the hill in central Panaji", "Taking a day trip to the historic churches of Old Goa", "Watching the sunset at Miramar Beach esplanade"],
    shopping: ["Panjim Municipal Market for local spices and cashews", "18th June Road shopping street", "Fontainhas art galleries for glazed tiles (azulejos)"],
    culture: ["Basilica of Bom Jesus holding St. Francis Xavier's remains", "Se Cathedral (largest church in Asia)", "Immaculate Conception Church baroque facade", "Fontainhas heritage area"]
  },
  "calangute": {
    name: "Calangute", country: "India", state: "Goa",
    landmarks: ["Calangute Beach", "Baga Beach (adjacent)", "Tito's Lane", "St. Alex Church", "Baga River estuary", "Aguada Fort (nearby)", "Chapora Fort (nearby)"],
    neighborhoods: ["Calangute Beach Road", "Baga Waterfront", "Tito's Club area", "St. Alex church area"],
    food: ["Goan Prawn Curry and Rice at beach shacks", "Grilled kingfish at Britto's on Baga Beach", "Chicken Cafreal", "Sweet Bebinca", "Chilled Kings Beer", "Feni cocktails"],
    activities: ["Parasailing and jet-skiing on Calangute Beach", "Partying at legendary night clubs in Tito's Lane", "Dining with candle-light directly on the sand at Baga beach shacks", "Watching local fishermen pull nets early in the morning", "Day trip exploring the lighthouse and walls of Fort Aguada"],
    shopping: ["Calangute Beach Road market for beachwear and trunks", "Saturday Night Market at Arpora (nearby)", "Tibetan market stalls near Baga"],
    culture: ["St. Alex Church unique dome architecture", "Fort Aguada 17th-century Portuguese fortress and lighthouse", "Chapora Fort ruins overlooking Vagator beach"]
  },
  "margao": {
    name: "Margao", country: "India", state: "Goa",
    landmarks: ["Holy Spirit Church", "Margao Municipal Garden", "Monte Hill Chapel", "Colva Beach (nearby)", "Benaulim Beach (nearby)", "Margao Bazaar", "Pandava Caves (Arvalem Caves nearby)"],
    neighborhoods: ["City Centre", "Monte Hill", "Fatorda", "Aquem", "Colva Coast"],
    food: ["Goan fish curry mess meals", "Pork Sorpotel with sanna (rice cakes)", "Traditional Goan sausage bread (Choris Pao)", "Sweet bebinca", "Local bakeries beef croquettes"],
    activities: ["Exploring the 17th-century Holy Spirit Church and its baroque square", "Climbing Monte Hill for views of Margao town", "Spending a relaxing day on the wide sandy shores of Colva Beach", "Browsing the busy municipal market for spices and dried fish", "Exploring the Arvalem rock-cut caves nearby"],
    shopping: ["Margao Municipal Market for spices, feni, and Goan sausages", "Colva beach bazaar for shell crafts", "Golden Heart Emporium bookshop"],
    culture: ["Holy Spirit Church historic architecture", "Monte Hill Chapel pilgrimage site", "Arvalem rock-cut caves associated with Pandavas", "Sat Burnam House historic mansion"]
  },
  "vagator": {
    name: "Vagator", country: "India", state: "Goa",
    landmarks: ["Vagator Beach", "Ozran Beach (Little Vagator)", "Chapora Fort ruins", "Shiva Face rock carving", "Anjuna Beach (nearby)", "Chapora River estuary"],
    neighborhoods: ["Chapora Village", "Vagator Beach Road", "Ozran Cliffs", "Anjuna Border"],
    food: ["Gourmet pizzas at local cafes", "Fresh fish fry at Chapora harbor taverns", "Greek food at Thalassa clifftop restaurant", "Goan fish thali", "Cashew feni cocktails"],
    activities: ["Climbing the stone ramparts of Chapora Fort (famous from Dil Chahta Hai)", "Watching the sunset from the cliffs of Vagator beach", "Finding the stone-carved Shiva Face on the beach rock at Ozran", "Having cocktails at upscale clifftop lounges like Thalassa", "Attending beach parties at local lounges"],
    shopping: ["Anjuna Flea Market (Wednesday nearby)", "Vagator local handicraft stalls", "Designer clothing shops on beach road"],
    culture: ["Chapora Fort ruins dating back to Adil Shah dynasty", "Local Goan-Portuguese village chapels in Chapora", "Traditional fishing harbor activities at Chapora River"]
  },
  "palolem": {
    name: "Palolem", country: "India", state: "Goa",
    landmarks: ["Palolem Beach", "Butterfly Beach (accessible by boat)", "Patnem Beach (adjacent)", "Canacona Island (Monkey Island)", "Cotigao Wildlife Sanctuary (nearby)", "Cabo de Rama Fort (nearby)"],
    neighborhoods: ["Palolem Beachfront", "Patnem coast", "Canacona town", "Cabo de Rama coast"],
    food: ["Fresh grilled lobster at beach shacks", "Goan fish curry and rice", "Vegan smoothie bowls at local health cafes", "Tandoori snapper", "Toddy and feni"],
    activities: ["Taking a boat trip to Butterfly Beach and Honeymoon Beach for dolphin spotting", "Walking across the shallow waters to Monkey Island at low tide", "Kayaking in the calm waters of Palolem lagoon", "Day trip to the cliffside ruins of Cabo de Rama Fort", "Attending a silent noise disco headphone party on the beach"],
    shopping: ["Palolem beach road market for hippie clothes, jewelry, and singing bowls", "Chaudi town local spice market"],
    culture: ["Cabo de Rama Fort ancient fort named after Lord Rama", "Traditional Goan fishing communities in Canacona", "Mallikarjuna Temple nearby (old Dravidian temple)"]
  },

  // Kerala Cities
  "kochi": {
    name: "Kochi", country: "India", state: "Kerala",
    landmarks: ["Fort Kochi", "Chinese Fishing Nets", "Mattancherry Palace (Dutch Palace)", "Paradesi Synagogue (Jew Town)", "Santa Cruz Basilica", "St. Francis Church", "Hill Palace Museum (Thripunithura)", "Marine Drive Kochi"],
    neighborhoods: ["Fort Kochi", "Mattancherry (Jew Town)", "Ernakulam City Centre", "Marine Drive", "Edappally", "Willingdon Island"],
    food: ["Kerala Parotta and Beef Fry/Chicken Stew", "Karimeen Pollichathu (pearl spot fish in banana leaf)", "Kochi seafood biryani", "Banana chips fried in coconut oil", "Dining at historic Jew Town warehouse cafes"],
    activities: ["Watching fishermen operate the giant Chinese Fishing Nets at Fort Kochi beach", "Strolling Jew Town to see antiques and spice warehouses", "Watching a Kathakali classical dance at the Kerala Kathakali Centre", "Viewing the Dutch murals at Mattancherry Palace", "Visiting the tomb of Vasco da Gama at St. Francis Church"],
    shopping: ["Jew Town antique shops", "Lulu Mall in Edappally (one of India's largest)", "Broadway Ernakulam for spices and local goods", "Devaraja market styled saree shops"],
    culture: ["Mattancherry Dutch Palace", "Paradesi Synagogue (oldest active synagogue in Commonwealth)", "St. Francis Church (first European church in India)", "Santa Cruz Cathedral Basilica", "Kerala Kathakali Centre performances"]
  },
  "munnar": {
    name: "Munnar", country: "India", state: "Kerala",
    landmarks: ["Tata Tea Museum", "Eravikulam National Park (Rajamala)", "Anamudi Peak", "Mattupetty Dam", "Echo Point", "Top Station", "Kundala Lake", "Attukad Waterfalls", "Lockhart Tea Museum"],
    neighborhoods: ["Munnar Town", "Old Munnar", "Mattupetty road", "Devikulam", "Pallivasal"],
    food: ["Traditional Kerala Meals on banana leaf", "Hot cardamom tea from tea gardens", "Kappa and Meen Curry (tapioca and spicy fish curry)", "Siddu styled appam and stew", "Kerala banana fritters (Pazham Pori)"],
    activities: ["Walking through the misty emerald tea gardens", "Spotting the endangered Nilgiri Tahr mountain goat in Eravikulam Park", "Boating on Mattupetty Dam and Kundala Lake", "Shouting out your name at the Echo Point mountain valley", "Hike up towards Top Station for views over Tamil Nadu border", "Visiting the Tata Tea Museum to see tea processing"],
    shopping: ["Munnar Town market for local spices (cardamom/cloves)", "Tata Tea factory outlets for fresh tea powder", "Homemade chocolates shops", "Aromatic oils stores"],
    culture: ["Lockhart Tea Estate history museum", "Munnar local churches and temple festival events", "Kathakali and Kalaripayattu shows at Punarjani Traditional Village"]
  },
  "alleppey": {
    name: "Alleppey", country: "India", state: "Kerala",
    landmarks: ["Alleppey Backwaters", "Alleppey Beach", "Alappuzha Lighthouse", "Vembanad Lake", "Pathiramanal Island", "Marari Beach (nearby)", "Ambalappuzha Sri Krishna Temple"],
    neighborhoods: ["Punnamada Lake area", "Lakeside", "Alleppey Town", "Mararikulam Beach area", "Beach Road"],
    food: ["Traditional houseboat lunch (Karimeen fish, red rice, cabbage thoran)", "Toddy shop spicy duck curry (Tharavu Roast) and tapioca", "Kerala appam with chicken curry", "Tender coconut water", "Kappa and fish curry"],
    activities: ["Boarding a traditional Kettuvallam wooden houseboat for an overnight cruise", "Taking a budget-friendly canoe or shikara boat through narrow canals", "Strolling the sandy Alleppey Beach and viewing the historic lighthouse", "Taking a speed boat ride across Vembanad Lake", "Birdwatching on the quiet Pathiramanal Island"],
    shopping: ["Alleppey town market for coir mats and rugs", "Spice shops for pepper and cardamom", "Marari beach local handicraft stalls"],
    culture: ["Kettuvallam traditional houseboat building crafts", "Ambalappuzha Temple famous for its sweet milk payasam", "Mullakkal Rajarajeswari Temple festival setting", "Coir Museum displaying coconut fiber crafts"]
  },
  "varkala": {
    name: "Varkala", country: "India", state: "Kerala",
    landmarks: ["Varkala Cliff and North Cliff Beach", "Janardhana Swamy Temple (2000-year-old)", "Papanasam Beach (Black Sand)", "Sivagiri Mutt", "Kapil Lake and Beach", "Anjengo Fort and Lighthouse (nearby)"],
    neighborhoods: ["North Cliff", "South Cliff", "Papanasam Beach area", "Temple Junction", "Sivagiri"],
    food: ["Freshly caught seafood (snapper, barracuda) at cliffside cafes", "Tibetan momos and thukpa at refugee cafes", "Healthy organic juices and fruit bowls", "Traditional Kerala Sadhya", "Filter coffee and local snacks"],
    activities: ["Walking along the dramatic clifftop path overlooking the Arabian Sea", "Swimming in the waters of Papanasam Beach (believed to wash away sins)", "Kayaking in the nearby Kapil Lake where backwaters meet the sea", "Visiting the Sivagiri Mutt ashram of Sree Narayana Guru", "Day trip to the historic British-built Anjengo Fort and its lighthouse"],
    shopping: ["North Cliff bazaar for silver jewelry, harem pants, and incense", "Temple Junction local flower and brassware stores", "Tibetan handicraft shops"],
    culture: ["Janardhana Swamy Temple historic Vaishnavite temple", "Sivagiri Mutt spiritual center", "Anjengo Fort colonial history", "Traditional Kathakali performances at Varkala Culture Center"]
  },
  "trivandrum": {
    name: "Trivandrum", country: "India", state: "Kerala",
    landmarks: ["Sree Padmanabhaswamy Temple", "Kanakakkunnu Palace", "Napier Museum and Art Gallery", "Thiruvananthapuram Zoo", "Kovalam Beach (nearby)", "Poovar Island (nearby)", "Kuthira Malika (Horse Palace)"],
    neighborhoods: ["East Fort", "Kovalam Coast", "Palayam", "Vellayambalam", "Poovar"],
    food: ["Kerala style mutton fry", "Puttu and Kadala Curry", "Saravana Bhavan filter coffee", "Boli sweet with payasam", "Trivandrum style chicken fry at local diners"],
    activities: ["Viewing Padmanabhaswamy Temple (the richest temple in the world)", "Exploring the Napier Museum's architectural wood carvings", "Taking a boat cruise through the mangrove forests of Poovar Island", "Sunbathing and watching the sunset at Kovalam Beach lighthouse", "Touring the Kuthira Malika palace wood carvings"],
    shopping: ["Connemara Market for local spices and fabrics", "Chalai Bazaar wholesale street", "Kovalam beach shacks for shell ornaments and cotton clothes"],
    culture: ["Sree Padmanabhaswamy Temple (Dravidian-style architectural marvel)", "Kuthira Malika royal palace museum", "Napier Museum historical relics", "Sree Chitra Art Gallery displaying Raja Ravi Varma paintings"]
  },

  // Karnataka Cities
  "bengaluru": {
    name: "Bengaluru", country: "India", state: "Karnataka",
    landmarks: ["Bangalore Palace", "Lalbagh Botanical Garden", "Cubbon Park", "Vidhana Soudha", "Bull Temple", "Tipu Sultan Palace", "Bannerghatta Park", "ISKCON Temple", "Nandi Hills"],
    neighborhoods: ["Indiranagar", "Koramangala", "Jayanagar", "Malleswaram", "Brigade Road", "MG Road"],
    food: ["Filter Coffee and Masala Dosa at Vidyarthi Bhavan or MTR", "Craft beer at Toit", "Traditional meals at Nagarjuna", "Idli and Vada at Airlines Hotel garden cafe", "Mysore Pak sweet"],
    activities: ["Walking the green paths of Cubbon Park", "Viewing the Lalbagh glasshouse", "Craft beer hopping in Indiranagar breweries", "Touring the Bangalore Palace", "Watching sunrise at Nandi Hills", "Monolithic Bull Temple visit"],
    shopping: ["Commercial Street for fabrics", "Brigade Road markets", "Chikpet for traditional sarees", "UB City mall for luxury"],
    culture: ["Vidhana Soudha assembly building", "Tipu Sultan's wood-carved palace", "National Gallery of Modern Art", "Government Museum"]
  },
  "mysuru": {
    name: "Mysuru", country: "India", state: "Karnataka",
    landmarks: ["Mysore Palace (Amba Vilas)", "Chamundi Hill and Chamundeshwari Temple", "Brindavan Gardens", "Mysore Zoo", "St. Philomena's Cathedral", "Jaganmohan Palace and Art Gallery", "Lalitha Mahal Palace", "Karanji Lake"],
    neighborhoods: ["City Centre", "Gokulam yoga hub", "Chamundi Hill area", "Devaraja Market area", "Siddhartha Layout"],
    food: ["Famous Mysore Masala Dosa at Mylari Restaurant", "Mysore Pak sweet", "Traditional Mysore Royal Thali", "Spicy mutton pulimunchi", "Local filter coffee"],
    activities: ["Touring the opulent Mysore Palace corridors", "Climbing Chamundi Hill to see the giant Nandi Bull statue", "Watching the musical fountain show at Brindavan Gardens", "Strolling past yoga studios in Gokulam", "Viewing paintings at Jaganmohan Palace art gallery", "Walking along Karanji Lake paths"],
    shopping: ["Devaraja Market for sandalwood oils, incense, and fresh flowers", "Mysore Silk Factory outlet for authentic silk sarees", "Sandalwood handicraft emporiums"],
    culture: ["Mysore Palace royal heritage museum", "St. Philomena's Cathedral Neo-Gothic architecture", "Chamundeshwari Temple historic hilltop shrine", "Jaganmohan Palace traditional paintings"]
  },
  "hampi": {
    name: "Hampi", country: "India", state: "Karnataka",
    landmarks: ["Virupaksha Temple", "Stone Chariot at Vittala Temple", "Lotus Mahal", "Elephant Stables", "Matanga Hill", "Hemakuta Hill Temples", "Hazara Rama Temple", "Anegundi (Hippie Island across river)", "Tungabhadra River", "Queens Bath"],
    neighborhoods: ["Hampi Bazaar (Temple area)", "Kamalapura", "Anegundi (Hippie Island)", "Kadirampura", "Sanapur Lake area"],
    food: ["Vegetarian meals at Mango Tree Restaurant", "Traditional Karnataka thali", "Wood-fired pizzas at hippie island cafes", "Fresh coconut water near ruins", "Lassi and herbal teas"],
    activities: ["Walking through the Virupaksha Temple courtyard", "Photographing the iconic Stone Chariot at Vittala Temple", "Climbing Matanga Hill for a spectacular sunrise over the ruins", "Crossing the Tungabhadra River in a circular coracle boat", "Renting a moped to explore Sanapur Lake and Anegundi village", "Watching sunset from Hemakuta Hill temples"],
    shopping: ["Hampi Bazaar local souvenir stalls", "Hippie clothing shops in Anegundi", "Stone carving workshops in Kamalapura"],
    culture: ["Virupaksha Temple (active since 7th century)", "Vittala Temple musical pillars and Stone Chariot", "Lotus Mahal and Elephant Stables (Indo-Islamic royal structures)", "Hazara Rama Temple stone bas-reliefs"]
  },
  "coorg": {
    name: "Coorg", country: "India", state: "Karnataka",
    landmarks: ["Abbey Falls", "Raja's Seat", "Namdroling Monastery (Golden Temple Bylakuppe)", "Talacauvery (Cauvery source)", "Dubare Elephant Camp", "Madikeri Fort", "Nagarhole National Park", "Chelavara Falls"],
    neighborhoods: ["Madikeri town", "Kushalnagar (Monastery area)", "Gonikoppal", "Virajpet", "Somwarpet"],
    food: ["Famous Coorg Pandi Curry (spicy pork curry in Kachampuli vinegar)", "Kadambuttu (steamed rice balls)", "Freshly brewed local Robusta coffee", "Bamboo shoot curry (Baimbale)", "Coorg honey and homemade wines"],
    activities: ["Feeding and bathing elephants at Dubare Elephant Camp", "Walking through misty paths to Abbey Falls inside coffee plantations", "Watching the sunset over the hills from Raja's Seat garden", "Viewing the golden statues at Namdroling Tibetan Monastery in Bylakuppe", "Day trip to Talacauvery source of Cauvery River on Brahmagiri hills"],
    shopping: ["Madikeri markets for fresh spices (pepper, cardamom)", "Coffee bean shops for Coorg coffee", "Tibetan shops in Bylakuppe for rugs and bells"],
    culture: ["Namdroling Tibetan Monastery (largest Nyingma center in India)", "Madikeri Fort historical palace structures", "Talacauvery holy temple site", "Traditional Kodava cultural festivals"]
  },
  "gokarna": {
    name: "Gokarna", country: "India", state: "Karnataka",
    landmarks: ["Mahabaleshwar Temple", "Om Beach", "Half Moon Beach", "Paradise Beach (Hippie beach)", "Kudle Beach", "Gokarna Cliff walk", "Mirjan Fort (nearby)", "Koti Teertha temple tank"],
    neighborhoods: ["Gokarna Town (Temple area)", "Kudle Beachfront", "Om Beach coast", "Paradise beach cove", "Mirjan village"],
    food: ["Fresh seafood at Kudle beach shacks", "Wood-fired pizzas at Namaste Cafe on Om Beach", "Banana pancakes", "Traditional South Indian vegetarian thali", "Fresh tender coconut"],
    activities: ["Doing the Gokarna beach trek (hiking over cliffs between Kudle, Om, Half Moon, and Paradise beaches)", "Visiting the sacred Atmalinga at Mahabaleshwar Temple", "Kayaking or banana boat riding on Om Beach", "Sunbathing at the quiet Paradise Beach", "Day trip exploring the ruins of Mirjan Fort", "Watching sunset into the sea from Kudle beach shacks"],
    shopping: ["Gokarna town temple road for brass oil lamps and incense", "Om beach shacks for beach shirts and beads", "Handmade shell ornaments stalls"],
    culture: ["Mahabaleshwar Temple (ancient Shiva temple housing Atmalinga)", "Koti Teertha holy bathing tank", "Mirjan Fort 16th-century architectural heritage site"]
  },

  // Maharashtra Cities
  "mumbai": {
    name: "Mumbai", country: "India", state: "Maharashtra",
    landmarks: ["Gateway of India", "Taj Mahal Palace Hotel", "CSMT Station", "Marine Drive", "Haji Ali Dargah", "Siddhivinayak Temple", "Elephanta Caves", "Bandra-Worli Sea Link"],
    neighborhoods: ["Colaba", "Bandra", "Juhu", "Marine Drive", "Fort", "Kala Ghoda"],
    food: ["Vada Pav at street stalls", "Pav Bhaji at Sardar", "Keema Ghotala at Café Leopold", "Irani Chai and Bun Maska at Yazdani Bakery", "Bhel Puri at Chowpatty Beach"],
    activities: ["Ferry from Gateway of India to Elephanta Caves", "Driving Bandra-Worli Sea Link", "Walking Marine Drive at sunset", "Drinks at Cafe Leopold", "Walking Juhu Beach in the evening"],
    shopping: ["Colaba Causeway bazaar", "Linking Road Bandra", "Crawford Market for spices"],
    culture: ["Elephanta Caves", "Kala Ghoda art galleries", "Haji Ali Dargah", "Siddhivinayak Temple"]
  },
  "pune": {
    name: "Pune", country: "India", state: "Maharashtra",
    landmarks: ["Shaniwar Wada", "Aga Khan Palace", "Dagadusheth Halwai Ganapati Temple", "Sinhagad Fort", "Pataleshwar Cave Temple", "Osho Teerth Park", "Raja Dinkar Kelkar Museum", "Saras Baug"],
    neighborhoods: ["Koregaon Park", "Deccan Gymkhana", "Camp (Pune Camp)", "FC Road (Fergusson College Road)", "Kothrud", "Aundh"],
    food: ["Famous Shrewsbury Biscuits from Kayani Bakery in Camp", "Spicy Misal Pav at Katakirr", "Traditional Maharashtrian Thali at Durvankur", "Mastani mango milkshake at Sujata Mastani", "Bakharwadi savory snack from Chitale Bandhu"],
    activities: ["Exploring the ruins of Shaniwar Wada fort", "Visiting the serene Aga Khan Palace where Mahatma Gandhi was detained", "Trekking up Sinhagad Fort for local pitla bhakri food", "Exploring the 8th-century rock-cut Pataleshwar Cave Temple", "Walking past cafes and shopping on FC Road in the evening"],
    shopping: ["Laxmi Road for traditional sarees and clothes", "FC Road for budget accessories", "Camp markets for bakeries and footwear"],
    culture: ["Aga Khan Palace Italian arch architecture museum", "Dagadusheth Halwai Temple famous giant golden Ganesh idol", "Pataleshwar Cave Temple rock-cut architecture", "Raja Kelkar Museum private collection"]
  },
  "lonavala": {
    name: "Lonavala", country: "India", state: "Maharashtra",
    landmarks: ["Bhaja Caves", "Karla Caves", "Lohagad Fort", "Tiger's Point (Tiger's Leap)", "Bushi Dam", "Lonavala Lake", "Kune Falls", "Duke's Nose viewpoint"],
    neighborhoods: ["Lonavala Town", "Khandala (adjacent)", "Bhaja village", "Lohagad foothills", "Valvan area"],
    food: ["Famous Lonavala Chikki (nut peanut brittle) from Cooper's or Maganlal", "Hot onion pakoras and ginger tea at Tiger's Point", "Spicy Maharashtrian misal pav", "Traditional fudge", "Roasted corn on the cob (bhutta)"],
    activities: ["Climbing the rock stairs to Karla and Bhaja ancient Buddhist Caves", "Trekking to the hilltop Lohagad Fort ruins", "Watching the clouds and waterfalls from Tiger's Point cliff", "Getting wet in the steps of Bushi Dam during monsoons", "Hike to Duke's Nose cliff for valley views", "Buying fresh chocolate fudge at Cooper's Bakery"],
    shopping: ["Lonavala Bazaar for Maganlal Chikki and Cooper's fudge", "Local wooden toy shops", "Fruit markets for fresh plums and berries"],
    culture: ["Karla Caves (largest Hinayana Buddhist rock-cut cave temples in India)", "Bhaja Caves historic stupas", "Lohagad Fort historical military gates and ramparts"]
  },
  "aurangabad": {
    name: "Aurangabad", country: "India", state: "Maharashtra",
    landmarks: ["Ajanta Caves (UNESCO)", "Ellora Caves (UNESCO)", "Kailash Temple (Ellora)", "Daulatabad Fort", "Bibi Ka Maqbara (Tomb of the Lady)", "Panchakki (Water Mill)", "Aurangabad Caves", "Grishneshwar Jyotirlinga Temple"],
    neighborhoods: ["Cidco", "Kranti Chowk", "Ellora village", "Ajanta valley road", "Begumpura"],
    food: ["Naan Qalia (traditional spicy meat and bread dish)", "Aurangabadi Mughlai biryani", "Traditional Maharashtrian meals", "Local sweet imarti", "Shrikhand dessert"],
    activities: ["Gazing in awe at the monolithic Kailash Temple hewn from a single rock at Ellora", "Viewing the ancient Buddhist fresco paintings inside Ajanta Caves", "Climbing the steep stone steps of the invincible Daulatabad Fort", "Taking photos of Bibi Ka Maqbara (the Taj of the Deccan)", "Visiting the 17th-century water mill of Panchakki"],
    shopping: ["Connaught Place Aurangabad for shopping", "Local shops for Himroo and Paithani silk sarees", "Bidriware silver inlay metal crafts shops"],
    culture: ["Ellora Caves (rock-cut temples of Hindu, Buddhist, and Jain faiths)", "Ajanta Caves (famous ancient Buddhist cave murals)", "Daulatabad Fort medieval military engineering marvel", "Bibi Ka Maqbara Mughal architecture", "Grishneshwar Temple historic jyotirlinga shrine"]
  },
  "nashik": {
    name: "Nashik", country: "India", state: "Maharashtra",
    landmarks: ["Panchavati", "Trimbakeshwar Shiva Temple (nearby)", "Sula Vineyards", "Kalaram Temple", "Pandavleni Caves", "Ram Kund temple tank", "Someshwar Waterfall", "York Winery"],
    neighborhoods: ["Panchavati area", "Gangapur Road", "College Road", "Trimbak town", "Sula estate grounds"],
    food: ["Famous Nashik Misal Pav at Sadhana Chulivarchi Misal", "Wine tastings at Sula Vineyards bistro", "Traditional Maharashtrian thali", "Local sweet peda", "Fresh grapes and guava from orchards"],
    activities: ["Taking a wine tasting and tour at the scenic Sula Vineyards", "Walking through Panchavati and Ram Kund where Lord Rama is believed to have bathed", "Climbing the steps to Pandavleni Buddhist Caves", "Day trip to Trimbakeshwar Temple (one of the 12 Jyotirlingas)", "Watching the evening Ganga Aarti at Ram Kund ghats"],
    shopping: ["Saraf Bazar for gold and silver jewelry", "College Road for fashion clothing", "Sula gift shop for wine accessories and merchandise"],
    culture: ["Trimbakeshwar Temple historic stone shrine", "Panchavati sacred forest area and Sita Gufa cave", "Pandavleni Caves (2nd century BC rock-cut chambers)", "Ram Kund sacred temple tank and ghats"]
  },

  // === Rest of Germany ===
  "munich": {
    name: "Munich", country: "Germany", state: "Bavaria",
    landmarks: ["Marienplatz and Glockenspiel", "Hofbräuhaus beer hall", "Nymphenburg Palace", "English Garden (Englischer Garten)", "Deutsches Museum", "BMW Museum", "Allianz Arena", "Residenz Munich", "St. Peter's Church", "Neuschwanstein Castle (accessible nearby)"],
    neighborhoods: ["Altstadt (Old Town)", "Schwabing", "Maxvorstadt", "Isarvorstadt", "Glockenbachviertel"],
    food: ["Sausages (Weisswurst) with sweet mustard", "Giant Pretzels (Brezeln)", "Pork Knuckle (Schweinshaxe)", "Munich Helles lager beer in Hofbräuhaus", "Apfelstrudel apple strudel", "Knödel potato dumplings"],
    activities: ["Watching surfers ride the Eisbach river wave in the English Garden", "Watching the Glockenspiel clock dance in Marienplatz", "Drinking a massive liter of beer at Hofbräuhaus beer hall", "Strolling in the park of Nymphenburg Palace", "Day trip to the fairy-tale Neuschwanstein Castle in Füssen", "Viewing classic cars at the BMW Museum"],
    shopping: ["Kaufingerstraße shopping street", "Viktualienmarkt outdoor food market", "Maximilianstraße designer boutiques"],
    culture: ["Munich Residenz royal palace", "Alte Pinakothek art gallery", "St. Peter's Church (Munich's oldest)", "Deutsches Museum (world's largest science museum)"]
  },
  "nuremberg": {
    name: "Nuremberg", country: "Germany", state: "Bavaria",
    landmarks: ["Nuremberg Castle (Kaiserburg)", "Hauptmarkt", "Albrecht Dürer's House", "Documentation Center Nazi Party Rally Grounds", "Germanic National Museum", "St. Lorenz Church", "Toy Museum", "Weißgerbergasse"],
    neighborhoods: ["Altstadt (Old Town)", "Gostenhof (GoHo)", "St. Johannis", "Südstadt"],
    food: ["Nürnberger Rostbratwurst (small grilled sausages)", "Lebkuchen gingerbread", "Rotbier local red beer", "Sauerkraut and potato salad", "Pretzels"],
    activities: ["Climbing up to Nuremberg Castle for city views", "Walking past colorful half-timbered houses on Weißgerbergasse", "Visiting the Albrecht Dürer historic artist house", "Learning history at the Nazi Party Rally Grounds museum", "Browsing the stalls of Hauptmarkt square"],
    shopping: ["Kaiserstraße shopping boutiques", "Hauptmarkt daily open market", "Handwerkerhof traditional craft courtyard shops"],
    culture: ["Kaiserburg historic castle", "Germanic National Museum cultural treasures", "St. Sebaldus Church", "Way of Human Rights street installation"]
  },
  "rothenburg ob der tauber": {
    name: "Rothenburg ob der Tauber", country: "Germany", state: "Bavaria",
    landmarks: ["Plönlein picturesque corner", "Rothenburg Town Hall", "Medieval Town Walls", "St. James' Church", "Crime and Punishment Museum", "Käthe Wohlfahrt Christmas Village", "Castle Garden (Burggarten)", "Gerlachschmiede"],
    neighborhoods: ["Altstadt (Inside Walls)", "Spital Quarter", "Tauber Valley surroundings"],
    food: ["Schneeball (Snowball pastry with sugar/chocolate)", "Traditional German pork roast", "Frankonian dry silvaner wine", "Local apple strudel", "Hearty potato soup"],
    activities: ["Walking along the top of the completely intact Medieval Town Walls", "Snapping a photo at the iconic Plönlein fork road", "Exploring the massive Käthe Wohlfahrt Christmas store", "Taking the Night Watchman's evening walking tour", "Walking through the Castle Garden for Tauber valley views"],
    shopping: ["Herrngasse souvenir shops", "Christmas craft shops in Käthe Wohlfahrt", "Local wine boutiques"],
    culture: ["St. James' Church holding Tilman Riemenschneider woodcarving altar", "Medieval Crime and Punishment Museum", "Imperial City Museum detailing town history"]
  },
  "füssen": {
    name: "Füssen", country: "Germany", state: "Bavaria",
    landmarks: ["Neuschwanstein Castle (Schloss Neuschwanstein)", "Hohenschwangau Castle", "Marienbrücke (Mary's Bridge)", "Forggensee Lake", "Lech Fall", "High Castle of Füssen (Hohes Schloss)", "St. Mang's Abbey"],
    neighborhoods: ["Füssen Old Town", "Schwangau castle village", "Hopfen am See lakeside area", "Bad Faulenbach"],
    food: ["Allgäu cheese soup (Kasspatzen)", "Traditional Bavarian pork roast and dumplings", "Local wheat beer (Weissbier)", "Warm apple strudel", "Brotzeit cold meat board"],
    activities: ["Touring the fairytale interior of Neuschwanstein Castle", "Walking across Marienbrücke bridge for views of the castle over the gorge", "Taking a boat cruise on Forggensee Lake under the Alps", "Walking to the rushing waters of Lech Fall", "Visiting the Gothic courtyards of the High Castle of Füssen"],
    shopping: ["Füssen Old Town pedestrian zone shops", "Schwangau castle tourist markets", "Local cheese shops for alpine cheeses"],
    culture: ["Neuschwanstein Castle (King Ludwig II's masterpiece)", "Hohenschwangau Castle (Ludwig's childhood home)", "Museum of the City of Füssen inside St. Mang's Abbey"]
  },

  // === rest of details, like other major cities ... ===
  "singapore": {
    name: "Singapore", country: "Singapore", state: "Singapore",
    landmarks: ["Gardens by the Bay", "Marina Bay Sands", "Sentosa Island", "Singapore Botanic Gardens", "Merlion Park", "Chinatown Singapore", "Little India Singapore", "Kampong Glam and Haji Lane", "Night Safari", "Universal Studios Singapore"],
    neighborhoods: ["Chinatown", "Little India", "Kampong Glam (Malay Quarter)", "Marina Bay", "Orchard Road", "Clarke Quay", "Katong"],
    food: ["Hainanese Chicken Rice at Tian Tian", "Chili Crab at Jumbo Seafood", "Lakhsa soup", "Kaya Toast and soft boiled eggs at Ya Kun Kaya Toast", "Satay skewers at Lau Pa Sat food center", "Char Kway Teow noodles", "Singapore Sling cocktail at Raffles Hotel Long Bar"],
    activities: ["Walking the OCBC Skyway in Gardens by the Bay under the Supertrees", "Riding the cable car to Sentosa Island", "Drinking a Singapore Sling at the historic Raffles Hotel", "Experiencing the Night Safari tram ride at Singapore Zoo", "Walking through the street art of Haji Lane", "Having street food at Lau Pa Sat hawker market"],
    shopping: ["Orchard Road shopping malls", "Mustafa Centre in Little India (open 24/7)", "Chinatown street markets for souvenirs", "Marina Bay Sands luxury shoppes"],
    culture: ["Buddha Tooth Relic Temple in Chinatown", "Sri Mariamman Hindu Temple", "Sultan Mosque in Kampong Glam", "Singapore Botanic Gardens (UNESCO listed)"]
  },
  "amsterdam": {
    name: "Amsterdam", country: "Netherlands", state: "North Holland",
    landmarks: ["Rijksmuseum", "Van Gogh Museum", "Anne Frank House", "Royal Palace of Amsterdam", "Vondelpark", "Dam Square", "Jordaan Canals", "Bloemenmarkt (Flower Market)", "Heineken Experience", "Red Light District"],
    neighborhoods: ["Jordaan", "De Pijp", "Museumplein", "Grachtengordel (Canal Belt)", "Red Light District (De Wallen)", "Amsterdam Noord"],
    food: ["Dutch Stroopwafels warm from street markets", "Friet (Dutch fries) with mayonnaise", "Poffertjes sweet mini pancakes", "Raw herring with onions at fish stands", "Bitterballen deep-fried snacks with beer", "Gouda and Edam cheeses"],
    activities: ["Taking a boat cruise along the historic Jordaan canals", "Exploring the galleries of Rijksmuseum", "Renting a bicycle to ride through Vondelpark", "Touring the Anne Frank House historic museum", "Drinking craft beers in the hipster neighborhood of De Pijp", "Walking past illuminated bridges at night"],
    shopping: ["Nine Streets (Negen Straatjes) boutique shopping area", "Bloemenmarkt floating flower market", "Albert Cuyp Market in De Pijp", "Kalverstraat high street"],
    culture: ["Rijksmuseum Dutch master paintings", "Van Gogh Museum", "Anne Frank House", "Royal Palace on Dam Square", "Oude Kerk (Amsterdam's oldest building)"]
  },
  "zurich": {
    name: "Zurich", country: "Switzerland", state: "Zürich",
    landmarks: ["Lake Zurich", "Grossmünster Church", "Fraumünster Church", "Bahnhofstrasse", "Uetliberg Mountain", "Swiss National Museum", "Lindenhof hill", "Zurich Opera House"],
    neighborhoods: ["Altstadt (Old Town)", "Zürich West", "Lindenhof", "Enge", "Seefeld"],
    food: ["Zürcher Geschnetzeltes (sliced veal in cream sauce)", "Traditional Cheese Fondue", "Swiss Raclette cheese", "Birchermüesli", "Luxemburgerli macarons from Sprüngli", "Swiss Chocolates from Lindt or Läderach"],
    activities: ["Taking a boat cruise on Lake Zurich", "Climbing the towers of Grossmünster Church for city views", "Hiking or taking train up Uetliberg Mountain for panoramas", "Walking along the high-end Bahnhofstrasse street", "Having a picnic at the historic Lindenhof hill overlooking the river"],
    shopping: ["Bahnhofstrasse high-end shopping street", "Zürich West trendy boutiques and viability markets", "Altstadt local craft shops"],
    culture: ["Swiss National Museum (Landesmuseum)", "Fraumünster Church Chagall stained glass windows", "Grossmünster medieval cathedral", "Kunsthaus Zurich art museum"]
  },
  "vienna": {
    name: "Vienna", country: "Austria", state: "Vienna",
    landmarks: ["Schönbrunn Palace", "Hofburg Palace", "St. Stephen's Cathedral (Stephansdom)", "Belvedere Palace", "Vienna State Opera", "Prater and Giant Ferris Wheel", "Albertina Museum", "Kunsthistorisches Museum", "Rathaus (City Hall)"],
    neighborhoods: ["Innere Stadt (Old Town)", "Spittelberg", "Neubau", "Leopoldstadt", "Landstraße"],
    food: ["Wiener Schnitzel (veal cutlet)", "Sachertorte chocolate cake at Café Sacher", "Apfelstrudel (apple strudel)", "Melange coffee at a traditional Viennese coffee house", "Tafelspitz boiled beef", "Local Grüner Veltliner white wine"],
    activities: ["Touring the grand baroque apartments of Schönbrunn Palace", "Attending an opera performance or touring the Vienna State Opera", "Riding the historic Giant Ferris Wheel in the Prater amusement park", "Listening to a classical Mozart or Strauss concert in a palace hall", "Climbing St. Stephen's Cathedral south tower", "Strolling in the Volksgarten rose gardens"],
    shopping: ["Kärntner Straße and Graben pedestrian shopping streets", "Naschmarkt outdoor food and flea market", "Mariahilfer Straße shopping street"],
    culture: ["Hofburg Palace (imperial residence of Habsburgs)", "Belvedere Palace holding Gustav Klimt's 'The Kiss'", "Kunsthistorisches Museum fine arts collection", "St. Stephen's Cathedral Gothic architecture"]
  },
  "brussels": {
    name: "Brussels", country: "Belgium", state: "Brussels",
    landmarks: ["Grand Place (Grote Markt)", "Manneken Pis", "Atomium", "Royal Palace of Brussels", "Belgian Comic Strip Center", "St. Michael and St. Gudula Cathedral", "Cinquantenaire Park", "Mini-Europe"],
    neighborhoods: ["Sablon", "Saint-Gilles", "Ixelles", "European Quarter", "Marolles"],
    food: ["Belgian Waffles with chocolate and strawberries", "Moules-Frites (mussels and fries)", "Belgian Chocolates from Neuhaus or Leonidas", "Belgian Trappist craft beers", "Speculoos cookies"],
    activities: ["Standing in awe of the gold-leaf guildhalls at Grand Place", "Taking photos of the giant steel spheres of the Atomium", "Having a beer tasting at Delirium Café (holds world record for beer selection)", "Strolling through the antique markets of Sablon", "Following the comic book street art trail across the city"],
    shopping: ["Galeries Royales Saint-Hubert glass-roofed shopping arcade", "Sablon antique shops", "Marolles flea market at Place du Jeu de Balle", "Rue Neuve shopping street"],
    culture: ["Grand Place UNESCO world heritage site", "Musical Instruments Museum in Art Nouveau building", "Belgian Comic Strip Center", "Royal Museums of Fine Arts of Belgium"]
  },
  "athens": {
    name: "Athens", country: "Greece", state: "Attica",
    landmarks: ["Acropolis and the Parthenon", "Acropolis Museum", "Ancient Agora of Athens", "Temple of Olympian Zeus", "Panathenaic Stadium", "Mount Lycabettus", "Syntagma Square", "Plaka historic district", "Odeon of Herodes Atticus", "National Archaeological Museum"],
    neighborhoods: ["Plaka", "Monastiraki", "Psirri", "Koukaki", "Kolonaki", "Gazi"],
    food: ["Souvlaki and Gyros pita wraps", "Moussaka eggplant casserole", "Fresh Greek Salad with feta and olives", "Spanakopita spinach pastry", "Tzatziki dip with pita", "Ouzo traditional anise liqueur", "Baklava dessert"],
    activities: ["Climbing up the Acropolis hill to view the ancient Parthenon ruins", "Viewing ancient friezes in the modern glass Acropolis Museum", "Taking the funicular railway up Mount Lycabettus for sunset views", "Walking through the narrow cobblestone lanes of Plaka neighborhood", "Watching the Changing of the Guard at Syntagma Square", "Browsing the Monastiraki Flea Market"],
    shopping: ["Ermou Street shopping district", "Monastiraki Flea Market", "Plaka tourist shops for olive oil and sandals", "Kolonaki designer fashion boutiques"],
    culture: ["The Parthenon temple", "Ancient Agora center of ancient democracy", "Panathenaic Stadium (birthplace of modern Olympic games)", "Odeon of Herodes Atticus roman amphitheater"]
  },
  "lisbon": {
    name: "Lisbon", country: "Portugal", state: "Lisbon",
    landmarks: ["Belém Tower", "Jerónimos Monastery", "Castelo de São Jorge", "Praca do Comercio", "Santa Justa Lift", "Padrão dos Descobrimentos", "Time Out Market", "Rua Augusta Arch", "Tram 28", "Alfama District"],
    neighborhoods: ["Alfama", "Bairro Alto", "Chiado", "Belém", "Baixa", "Principe Real"],
    food: ["Pastel de Nata (warm egg custard tart) from Pastéis de Belém", "Bacalhau (salted cod fish prepared in local styles)", "Sardinhas Assadas (grilled sardines)", "Ginjinha cherry liqueur in small cups", "Caldo Verde cabbage soup", "Traditional Portuguese bifana pork sandwich"],
    activities: ["Riding the historic yellow Tram 28 up the steep hills of Alfama", "Climbing the ramparts of Castelo de São Jorge for tagus river views", "Eating custard tarts fresh out of the oven in Belém", "Listening to traditional Fado music in a cozy Alfama tavern at night", "Having dinner and craft beers at the busy Time Out Market Lisbon", "Riding the iron elevator of Santa Justa Lift"],
    shopping: ["Rua Augusta pedestrian shopping street", "Feira da Ladra (Thieves flea market on Tuesdays/Saturdays)", "Chiado bookstores and designer boutiques", "Time Out Market food stalls"],
    culture: ["Jerónimos Monastery Manueline-style architecture", "Belém Tower maritime defense fort", "São Jorge Castle medieval Moorish castle", "National Tile Museum (Museu Nacional do Azulejo)"]
  },
  "hanoi": {
    name: "Hanoi", country: "Vietnam", state: "Hanoi",
    landmarks: ["Hoan Kiem Lake and Ngoc Son Temple", "Hanoi Old Quarter", "Ho Chi Minh Mausoleum", "Temple of Literature", "One Pillar Pagoda", "Hanoi Opera House", "Thang Long Water Puppet Theatre", "Imperial Citadel of Thang Long", "West Lake", "Dong Xuan Market"],
    neighborhoods: ["Old Quarter (36 Streets)", "Ba Dinh", "Tay Ho (West Lake)", "French Quarter", "Truc Bach"],
    food: ["Traditional Pho soup (beef or chicken)", "Bun Cha (grilled pork and noodles)", "Banh Mi sandwiches", "Egg Coffee (Ca Phe Trung) at Cafe Giang", "Nem Ran (fried spring rolls)", "Bia Hoi cheap fresh draught beer at Ta Hien street"],
    activities: ["Walking around Hoan Kiem Lake in the misty morning", "Taking a cyclocart ride through the busy streets of the Old Quarter", "Watching a traditional water puppet show at Thang Long Theatre", "Drinking Egg Coffee at a hidden balcony cafe in the Old Quarter", "Visiting the Temple of Literature (Vietnam's first university)", "Strolling past cafes on Hanoi Train Street as the train passes"],
    shopping: ["Hanoi Old Quarter craft streets (each street specializing in a craft)", "Dong Xuan Market covered bazaar", "Hanoi Weekend Night Market stalls", "Trang Tien Plaza shopping mall"],
    culture: ["Temple of Literature dedicated to Confucius", "Ho Chi Minh Mausoleum presidential memorial", "One Pillar Pagoda iconic Buddhist temple", "Imperial Citadel historic excavations"]
  },
  "bali": {
    name: "Bali", country: "Indonesia", state: "Bali",
    landmarks: ["Tanah Lot Temple", "Uluwatu Temple", "Tegallalang Rice Terraces", "Mount Batur", "Tirta Empul Holy Water Temple", "Ubud Monkey Forest", "Besakih Great Temple", "Nusa Penida Kelingking Beach", "Seminyak Beach", "Ulun Danu Bratan Temple"],
    neighborhoods: ["Ubud cultural center", "Seminyak beach clubs area", "Canggu surf hub", "Uluwatu clifftops", "Nusa Dua resorts", "Kuta beach area"],
    food: ["Babi Guling (crispy roasted suckling pig)", "Nasi Goreng fried rice", "Sate Lilit minced fish skewers", "Nasi Campur mixed rice plate", "Fresh coconut water on the beach", "Traditional Balinese coffee"],
    activities: ["Watching the Kecak Fire Dance at Uluwatu Temple at sunset", "Strolling through the stepped emerald Tegallalang Rice Terraces", "Taking a purifying bath in the holy springs of Tirta Empul", "Hiking up Mount Batur active volcano for sunrise", "Surfing or visiting beach clubs in Seminyak or Canggu", "Taking a speedboat excursion to Kelingking Beach on Nusa Penida"],
    shopping: ["Ubud Traditional Art Market for batik and wood carvings", "Seminyak boutique fashion streets", "Canggu organic markets", "Sukawati Art Market"],
    culture: ["Tanah Lot sea temple", "Uluwatu clifftop temple", "Tirta Empul purification temple", "Pura Besakih mother temple on Mount Agung", "Ubud Royal Palace traditional dance Recitals"]
  },
  "seoul": {
    name: "Seoul", country: "South Korea", state: "Seoul",
    landmarks: ["Gyeongbokgung Palace", "N Seoul Tower (Namsan)", "Bukchon Hanok Village", "Dongdaemun Design Plaza (DDP)", "Myeongdong Cathedral", "Cheonggyecheon Stream", "Lotte World Tower", "Changdeokgung Palace and Secret Garden", "Insadong Street", "Gwangjang Market"],
    neighborhoods: ["Hongdae youth area", "Gangnam upscale area", "Itaewon international district", "Myeongdong shopping district", "Insadong traditional art area", "Bukchon", "Dongdaemun"],
    food: ["Korean BBQ pork belly (Samgyeopsal)", "Korean Fried Chicken with draft beer (Chimaek)", "Bibimbap mixed rice bowl", "Street food at Gwangjang Market (Mungbean pancakes, tteokbokki, gimbap)", "Ginseng Chicken Soup (Samgyetang)", "Kimchi stew (Kimchi Jjigae)"],
    activities: ["Renting a traditional Hanbok dress to tour Gyeongbokgung Palace for free", "Walking through the historic tile-roofed houses of Bukchon Hanok Village", "Enjoying 360-degree night views of Seoul from N Seoul Tower", "Strolling along the restored Cheonggyecheon Stream pathway", "Drinking Soju and eating street food in a tented cart (Pojangmacha)", "Shopping for cosmetics in Myeongdong"],
    shopping: ["Myeongdong cosmetics and fashion shopping belt", "Insadong traditional art and souvenir shops", "Dongdaemun fashion market (open overnight)", "Starfield COEX Mall inside Gangnam"],
    culture: ["Gyeongbokgung Palace royal architecture", "Changdeokgung Palace and its UNESCO Secret Garden", "National Folk Museum of Korea", "Jogyesa Temple Zen Buddhist center", "Bongeunsa Temple in Gangnam"]
  }
};

// Merge databases
const mergedCities = { ...citiesDb };
for (const [key, val] of Object.entries(extraCities)) {
  const normKey = key.toLowerCase().trim();
  mergedCities[normKey] = val;
}

// Compile final database
const finalDb = {
  cities: mergedCities,
  regions: regionsMapping
};

// Write to JSON
const outputPath = path.join(__dirname, 'known_cities.json');
fs.writeFileSync(outputPath, JSON.stringify(finalDb, null, 2), 'utf8');

console.log(`Successfully built known_cities.json at ${outputPath}`);
console.log(`Total cities: ${Object.keys(mergedCities).length}`);
console.log(`Total regions: ${Object.keys(regionsMapping).length}`);
