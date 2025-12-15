// modules/LoreGenerator.js - COMPLETE PRODUCTION CODE

class LoreGenerator {
    constructor(app) {
        this.app = app;
        this.loreTemplates = this.initializeTemplates();
        this.generatedLore = new Map(); // Cache for generated lore
    }

    initializeTemplates() {
        return {
            // City Names
            cityNames: {
                prefixes: [
                    'Silver', 'Golden', 'Iron', 'Stone', 'Crystal', 'Shadow', 'Sun', 'Moon',
                    'Star', 'Fire', 'Ice', 'Storm', 'Sky', 'Earth', 'Sea', 'River',
                    'Forest', 'Mountain', 'Valley', 'Dawn', 'Dusk', 'North', 'South',
                    'East', 'West', 'High', 'Low', 'New', 'Old', 'Great', 'Little'
                ],
                suffixes: [
                    'haven', 'port', 'keep', 'watch', 'ford', 'bridge', 'burg', 'town',
                    'ville', 'field', 'wood', 'stone', 'rock', 'peak', 'vale', 'dale',
                    'mere', 'fell', 'wick', 'stead', 'ham', 'borough', 'cester', 'minster',
                    'gate', 'wall', 'tower', 'spire', 'hall', 'court', 'gard', 'holm'
                ],
                fantasy: [
                    'Eldoria', 'Avalon', 'Mythrendor', 'Celestia', 'Arcanum', 'Valoria',
                    'Dragonreach', 'Feywood', 'Stormhaven', 'Ironhold', 'Shadowfen',
                    'Crystal Spire', 'Sunstone', 'Moonshadow', 'Starfall', 'Firepeak',
                    'Frostholm', 'Windhelm', 'Stonehaven', 'Rivertown', 'Forestheart'
                ]
            },

            // Ruler Titles and Names
            rulers: {
                titles: [
                    'King', 'Queen', 'Prince', 'Princess', 'Lord', 'Lady', 'Baron', 'Baroness',
                    'Count', 'Countess', 'Duke', 'Duchess', 'Archduke', 'Archduchess',
                    'Emperor', 'Empress', 'Regent', 'Steward', 'Governor', 'Mayor',
                    'High Priest', 'High Priestess', 'Archmage', 'Grand Master',
                    'Chieftain', 'Elder', 'Council of', 'Guild Master'
                ],
                names: [
                    'Aric', 'Baldric', 'Cassian', 'Darian', 'Eldric', 'Favian', 'Gareth',
                    'Hadrian', 'Ivan', 'Jareth', 'Kael', 'Lucian', 'Marius', 'Nerian',
                    'Orion', 'Percival', 'Quinn', 'Roderick', 'Silas', 'Thrain', 'Uther',
                    'Valerius', 'Xander', 'Yorick', 'Zephyr',
                    'Althea', 'Brianna', 'Cassandra', 'Diana', 'Elara', 'Fiona', 'Gwendolyn',
                    'Helena', 'Isolde', 'Jocelyn', 'Katherine', 'Lilith', 'Morgana', 'Nadia',
                    'Ophelia', 'Persephone', 'Quintessa', 'Rhiannon', 'Seraphina', 'Thalia',
                    'Ursula', 'Valeria', 'Winifred', 'Xenia', 'Yvaine', 'Zara'
                ],
                traits: [
                    'wise but reclusive', 'brave but reckless', 'kind but naive',
                    'cunning but paranoid', 'just but stern', 'charismatic but vain',
                    'pious but fanatical', 'scholarly but absent-minded',
                    'wealthy but miserly', 'powerful but cruel', 'honorable but rigid',
                    'ambitious but ruthless', 'peaceful but weak', 'warlike but brash',
                    'mysterious but untrustworthy', 'popular but corrupt'
                ]
            },

            // City Problems/Conflicts
            problems: [
                'plagued by thieves and cutpurses',
                'divided by noble house rivalries',
                'suffering from a mysterious plague',
                'threatened by an ancient curse',
                'on the brink of civil war',
                'occupied by a foreign power',
                'struggling with famine and drought',
                'corrupted by a cult from within',
                'haunted by undead spirits',
                'infested with monstrous creatures',
                'cursed with eternal winter',
                'ruled by a tyrannical overlord',
                'torn apart by religious conflict',
                'sinking into the swamp',
                'being consumed by a magical blight',
                'terrorized by a dragon'
            ],

            // City Features/Specialties
            features: [
                'famous for its floating markets',
                'built atop ancient ruins',
                'known for its crystal-powered machinery',
                'defended by golem guardians',
                'illuminated by perpetual magical lights',
                'connected by underground canals',
                'protected by an ancient magical ward',
                'built around a massive world tree',
                'suspended between mountain peaks',
                'carved entirely from living stone',
                'floating on a cloud of magic',
                'built inside a giant fossil',
                'surrounded by talking statues',
                'illuminated by glowing mushrooms',
                'protected by a council of wizards',
                'built around a time-frozen battlefield'
            ],

            // Economy/Trade
            economy: [
                'thriving trade hub on a major river',
                'mining town rich in rare minerals',
                'fishing village with the best seafood',
                'agricultural center with magical crops',
                'artisan community famous for craftsmanship',
                'scholarly city with a great library',
                'military fortress controlling a strategic pass',
                'religious center with a holy site',
                'entertainment capital with grand arenas',
                'alchemical center producing rare potions',
                'black market for illegal magical artifacts',
                'slave trading post (dark secret)',
                'neutral ground for diplomatic meetings',
                'refugee settlement from a destroyed kingdom',
                'pirate haven disguised as a legitimate port',
                'magical research facility experimenting dangerously'
            ],

            // Secrets
            secrets: [
                'the ruler is actually a doppelganger',
                'the city is built on a sleeping elder god',
                'all citizens are part of a hive mind',
                'time flows differently within the city walls',
                'the city is a prison for a powerful demon',
                'the fountain of youth is hidden in the sewers',
                'a dragon sleeps beneath the citadel',
                'the city is a front for a thieves guild',
                'magic is artificially suppressed here',
                'the dead walk among the living unnoticed',
                'the city moves to a new location each night',
                'all memories of visitors are erased upon leaving',
                'the city is a testing ground for dark experiments',
                'a cult controls everything from the shadows',
                'the city is slowly sinking into another dimension',
                'every building is secretly alive'
            ],

            // Landmark Descriptions
            landmarks: {
                tavern: [
                    'a rowdy establishment known for its strong ale',
                    'a quiet inn favored by travelers and spies',
                    'a luxurious tavern with exotic entertainments',
                    'a seedy dive where deals are made in shadows',
                    'a family-run inn with the best home cooking',
                    'a magical tavern that changes location nightly'
                ],
                temple: [
                    'an ancient temple dedicated to forgotten gods',
                    'a soaring cathedral with stained glass windows',
                    'a humble shrine tended by a single priest',
                    'a underground sanctuary for forbidden worship',
                    'a floating temple accessible only by magic',
                    'a temple built around a natural wonder'
                ],
                market: [
                    'a bustling bazaar with goods from across the world',
                    'a black market dealing in illegal magical items',
                    'a floating market on boats and barges',
                    'a night market that appears only under moonlight',
                    'a magical market where memories are traded',
                    'a silent market where all business is done in sign language'
                ],
                gate: [
                    'a massive iron gate decorated with protective runes',
                    'a magical portal that leads to other cities',
                    'a hidden gate known only to the thieves guild',
                    'a gate that only opens for those with pure hearts',
                    'a crumbling gate that\'s more symbolic than functional',
                    'a living gate grown from magical trees'
                ]
            }
        };
    }

    generateCityLore(cityData) {
        const seed = cityData?.meta?.seed || Date.now();
        const random = new SeededRandom(seed);
        
        // Check cache first
        const cacheKey = `lore_${seed}_${JSON.stringify(cityData.city.tags)}`;
        if (this.generatedLore.has(cacheKey)) {
            return this.generatedLore.get(cacheKey);
        }

        const city = cityData.city;
        const tags = city.tags || [];
        
        // Generate city name
        const cityName = this.generateCityName(random, tags);
        
        // Generate ruler
        const ruler = this.generateRuler(random);
        
        // Generate problems based on tags
        const problems = this.generateProblems(random, tags);
        
        // Generate features based on city characteristics
        const features = this.generateFeatures(random, city);
        
        // Generate economy
        const economy = this.generateEconomy(random, city);
        
        // Generate secret
        const secret = this.generateSecret(random);
        
        // Generate history
        const history = this.generateHistory(random, cityName, tags);
        
        // Generate notable locations from POIs
        const notableLocations = this.generateNotableLocations(city.pois || []);
        
        const lore = {
            name: cityName,
            ruler: ruler,
            description: `${cityName} is ${problems}. ${features}.`,
            fullDescription: this.generateFullDescription(cityName, ruler, problems, features, economy),
            history: history,
            economy: economy,
            secret: secret,
            notableLocations: notableLocations,
            stats: {
                population: this.estimatePopulation(city),
                wealth: this.estimateWealth(city),
                danger: this.estimateDanger(tags),
                magic: this.estimateMagic(tags),
                influence: this.estimateInfluence(city)
            },
            tags: this.generateLoreTags(tags, city),
            rumor: this.generateRumor(random, secret)
        };
        
        // Cache the result
        this.generatedLore.set(cacheKey, lore);
        
        return lore;
    }

    generateCityName(random, tags) {
        // 30% chance for fantasy name, 70% for generated name
        if (random.random() < 0.3) {
            return random.pick(this.loreTemplates.cityNames.fantasy);
        }
        
        const prefix = random.pick(this.loreTemplates.cityNames.prefixes);
        const suffix = random.pick(this.loreTemplates.cityNames.suffixes);
        
        // Special cases based on tags
        if (tags.includes('waterfront') || tags.includes('coast')) {
            const waterSuffixes = ['port', 'haven', 'bay', 'shore', 'strand'];
            return `${prefix}${random.pick(waterSuffixes)}`;
        }
        
        if (tags.includes('forests')) {
            const forestSuffixes = ['wood', 'forest', 'grove', 'copse', 'glen'];
            return `${prefix}${random.pick(forestSuffixes)}`;
        }
        
        if (tags.includes('dry')) {
            const drySuffixes = ['sand', 'dust', 'waste', 'bluff', 'mesa'];
            return `${prefix}${random.pick(drySuffixes)}`;
        }
        
        return `${prefix}${suffix}`;
    }

    generateRuler(random) {
        const title = random.pick(this.loreTemplates.rulers.titles);
        const name = random.pick(this.loreTemplates.rulers.names);
        const trait = random.pick(this.loreTemplates.rulers.traits);
        
        return {
            title: title,
            name: name,
            fullTitle: `${title} ${name}`,
            trait: trait,
            description: `${title} ${name} is ${trait}.`
        };
    }

    generateProblems(random, tags) {
        const baseProblems = [...this.loreTemplates.problems];
        
        // Add tag-specific problems
        if (tags.includes('chaotic')) {
            baseProblems.push('constantly rebuilding after magical disasters');
            baseProblems.push('ruled by competing gangs and factions');
        }
        
        if (tags.includes('multi-level')) {
            baseProblems.push('suffering from class strife between upper and lower levels');
        }
        
        if (tags.includes('city-walls')) {
            baseProblems.push('trapped within its own walls, resources dwindling');
        }
        
        if (tags.includes('waterfront') && tags.includes('forests')) {
            baseProblems.push('caught between logging interests and fishing rights');
        }
        
        return random.pick(baseProblems);
    }

    generateFeatures(random, city) {
        const baseFeatures = [...this.loreTemplates.features];
        
        // Add features based on city characteristics
        if (city.waterAreas && city.waterAreas.length > 0) {
            baseFeatures.push('crisscrossed by canals and waterways');
            baseFeatures.push('built on stilts over the water');
        }
        
        if (city.walls && city.walls.length > 0) {
            baseFeatures.push('protected by ancient, magically-enhanced walls');
            baseFeatures.push('a fortress city with impenetrable defenses');
        }
        
        if (city.pois && city.pois.some(p => p.type === 'Temple')) {
            baseFeatures.push('dominated by towering religious structures');
        }
        
        if (city.blocks && city.blocks.length > 20) {
            baseFeatures.push('a sprawling metropolis with distinct districts');
        }
        
        return random.pick(baseFeatures);
    }

    generateEconomy(random, city) {
        const baseEconomy = [...this.loreTemplates.economy];
        
        // Adjust based on city size and features
        if (city.buildings && city.buildings.length > 50) {
            baseEconomy.push('major economic powerhouse of the region');
        }
        
        if (city.pois && city.pois.some(p => p.type === 'Market')) {
            baseEconomy.push('center of commerce with extensive market districts');
        }
        
        if (city.pois && city.pois.some(p => p.type === 'Smithy')) {
            baseEconomy.push('renowned for its metalwork and weapon crafting');
        }
        
        return random.pick(baseEconomy);
    }

    generateSecret(random) {
        return random.pick(this.loreTemplates.secrets);
    }

    generateHistory(random, cityName, tags) {
        const ages = ['Ancient', 'First Age', 'Second Age', 'Third Age', 'Current Age'];
        const events = [
            `Founded by ${random.pick(['explorers', 'refugees', 'a prophet', 'a dragon', 'wandering nomads'])}`,
            `Built upon the ruins of an older civilization`,
            `Site of a great battle that shaped the region`,
            `Blessed (or cursed) by ${random.pick(['the gods', 'a powerful wizard', 'an ancient spirit'])}`,
            `Expanded rapidly during ${random.pick(['a gold rush', 'a magical renaissance', 'a time of peace'])}`,
            `Nearly destroyed by ${random.pick(['a plague', 'a dragon attack', 'a magical disaster', 'an invasion'])}`
        ];
        
        const history = {
            founding: random.pick(events),
            majorEvents: [],
            currentAge: `${ages[ages.length - 1]}: ${cityName} stands as it does today`
        };
        
        // Add 2-4 major historical events
        const eventCount = 2 + random.randomInt(0, 2);
        for (let i = 0; i < eventCount; i++) {
            history.majorEvents.push({
                age: ages[i + 1],
                event: random.pick(events)
            });
        }
        
        // Add tag-specific history
        if (tags.includes('citadel')) {
            history.majorEvents.push({
                age: random.pick(ages),
                event: `The citadel was constructed to defend against ${random.pick(['orc invasions', 'dragon attacks', 'neighboring kingdoms'])}`
            });
        }
        
        if (tags.includes('city-walls')) {
            history.majorEvents.push({
                age: random.pick(ages),
                event: `The walls were built in response to ${random.pick(['a great war', 'monster attacks', 'a prophesied doom'])}`
            });
        }
        
        return history;
    }

    generateNotableLocations(pois) {
        const locations = {};
        
        pois.forEach(poi => {
            if (!locations[poi.type]) {
                locations[poi.type] = [];
            }
            
            const template = this.loreTemplates.landmarks[poi.type.toLowerCase()];
            const description = template ? random.pick(template) : 'an important location in the city';
            
            locations[poi.type].push({
                name: poi.label,
                description: description,
                secret: poi.secret ? 'This location has a hidden secret' : undefined
            });
        });
        
        return locations;
    }

    generateFullDescription(cityName, ruler, problems, features, economy) {
        return `
            ${cityName}, ${economy}, is ${problems}. The city is ${features}.
            
            Ruled by ${ruler.fullTitle}, ${ruler.trait}. Under ${ruler.title.split(' ').pop()}'s rule,
            the city has become ${this.getCityState(problems)}.
            
            Travelers come here seeking ${this.getAttraction(features)}, while locals
            ${this.getLocalActivity(problems)}. Despite its challenges, ${cityName}
            remains ${this.getCityVitality(features)}.
        `.replace(/\s+/g, ' ').trim();
    }

    getCityState(problems) {
        if (problems.includes('thriving') || problems.includes('prosperous')) {
            return 'a beacon of civilization';
        } else if (problems.includes('plagued') || problems.includes('suffering')) {
            return 'a city struggling to survive';
        } else if (problems.includes('divided') || problems.includes('torn')) {
            return 'a city of contrasts and conflicts';
        }
        return 'what it is today';
    }

    getAttraction(features) {
        if (features.includes('magical') || features.includes('ancient')) {
            return 'magical wonders and ancient secrets';
        } else if (features.includes('trade') || features.includes('market')) {
            return 'wealth and opportunity';
        } else if (features.includes('religious') || features.includes('holy')) {
            return 'spiritual enlightenment';
        }
        return 'adventure and opportunity';
    }

    getLocalActivity(problems) {
        if (problems.includes('thieves') || problems.includes('crime')) {
            return 'watch their backs and their purses';
        } else if (problems.includes('drought')) {
            return 'struggle to find their next meal';
        } else if (problems.includes('war') || problems.includes('conflict')) {
            return 'prepare for the next battle';
        }
        return 'go about their daily lives';
    }

    getCityVitality(features) {
        if (features.includes('ancient') || features.includes('enduring')) {
            return 'an enduring testament to civilization';
        } else if (features.includes('magical') || features.includes('wondrous')) {
            return 'a place of wonder and magic';
        } else if (features.includes('strategic') || features.includes('defensible')) {
            return 'a bastion of safety in dangerous times';
        }
        return 'a place worth calling home';
    }

    generateLoreTags(tags, city) {
        const loreTags = [...tags];
        
        if (city.pois && city.pois.length > 10) {
            loreTags.push('many-landmarks');
        }
        
        if (city.blocks && city.blocks.length > 15) {
            loreTags.push('sprawling');
        }
        
        if (city.waterAreas && city.waterAreas.length > 0) {
            loreTags.push('water-features');
        }
        
        if (city.walls && city.walls.length > 0) {
            loreTags.push('fortified');
        }
        
        if (city.trees && city.trees.length > 20) {
            loreTags.push('green');
        }
        
        return loreTags;
    }

    generateRumor(random, secret) {
        const rumors = [
            `Whispers say that ${secret.toLowerCase()}`,
            `Some claim to have seen evidence that ${secret.toLowerCase()}`,
            `A drunk guard once confessed that ${secret.toLowerCase()}`,
            `Children tell stories about how ${secret.toLowerCase()}`,
            `An old prophecy suggests that ${secret.toLowerCase()}`
        ];
        
        return random.pick(rumors);
    }

    estimatePopulation(city) {
        if (!city.buildings) return 'Unknown';
        
        const buildingCount = city.buildings.length;
        if (buildingCount < 10) return 'Small village (50-200)';
        if (buildingCount < 30) return 'Large village (200-1000)';
        if (buildingCount < 100) return 'Town (1,000-5,000)';
        if (buildingCount < 300) return 'City (5,000-20,000)';
        return 'Metropolis (20,000+)';
    }

    estimateWealth(city) {
        if (!city.pois) return 'Average';
        
        const wealthyMarkers = ['Market', 'Temple', 'Keep'].filter(type => 
            city.pois.some(p => p.type === type)
        ).length;
        
        if (wealthyMarkers >= 3) return 'Wealthy';
        if (wealthyMarkers >= 1) return 'Prosperous';
        return 'Modest';
    }

    estimateDanger(tags) {
        let danger = 3; // 1-5 scale
        
        if (tags.includes('chaotic')) danger += 1;
        if (tags.includes('backdoor')) danger += 1;
        if (tags.includes('city-walls')) danger -= 1;
        if (tags.includes('citadel')) danger -= 1;
        
        return Math.max(1, Math.min(5, danger));
    }

    estimateMagic(tags) {
        let magic = 3; // 1-5 scale
        
        if (tags.includes('multi-level')) magic += 1;
        if (tags.includes('chaotic')) magic += 1;
        if (tags.includes('dry')) magic -= 1;
        if (tags.includes('compact')) magic -= 1;
        
        return Math.max(1, Math.min(5, magic));
    }

    estimateInfluence(city) {
        if (!city.blocks) return 'Local';
        
        const size = city.blocks.length;
        if (size < 10) return 'Local';
        if (size < 30) return 'Regional';
        if (size < 100) return 'Kingdom';
        return 'Continental';
    }

    generatePOIDescription(poi) {
        const templates = this.loreTemplates.landmarks[poi.type.toLowerCase()];
        if (!templates) {
            return `The ${poi.label}, an important location in the city.`;
        }
        
        const random = new SeededRandom(poi.label.charCodeAt(0));
        const description = random.pick(templates);
        
        // Add specific details based on poi properties
        let details = '';
        
        if (poi.secret) {
            details = ' Rumors suggest this location holds a secret.';
        }
        
        if (poi.description) {
            details = ` ${poi.description}`;
        }
        
        return `${description}.${details}`;
    }

    clearCache() {
        this.generatedLore.clear();
    }
}

// Helper class for seeded random in lore generation
class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    }
    
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    
    random() {
        return this.next();
    }
    
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    
    pick(arr) {
        return arr[this.randomInt(0, arr.length - 1)];
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoreGenerator;
} else {
    window.LoreGenerator = LoreGenerator;
}