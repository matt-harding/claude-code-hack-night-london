// Lord of the Rings Knowledge Graph Seed Data

// Clear existing data
MATCH (n) DETACH DELETE n;

// Create Races
CREATE (race_hobbit:Race {name: 'Hobbit', description: 'Small, peaceful folk of the Shire'})
CREATE (race_human:Race {name: 'Human', description: 'Men of Middle-earth'})
CREATE (race_elf:Race {name: 'Elf', description: 'Immortal firstborn of Ilúvatar'})
CREATE (race_dwarf:Race {name: 'Dwarf', description: 'Children of Aulë, master craftsmen'})
CREATE (race_wizard:Race {name: 'Wizard', description: 'Maiar sent to Middle-earth'})
CREATE (race_orc:Race {name: 'Orc', description: 'Corrupted creatures of Morgoth'})
CREATE (race_ent:Race {name: 'Ent', description: 'Tree shepherds of Fangorn'})

// Create Locations
CREATE (loc_shire:Location {name: 'The Shire', type: 'Region', realm: 'Eriador'})
CREATE (loc_rivendell:Location {name: 'Rivendell', type: 'City', realm: 'Eriador', aka: 'Imladris'})
CREATE (loc_moria:Location {name: 'Moria', type: 'Mine', realm: 'Misty Mountains', aka: 'Khazad-dûm'})
CREATE (loc_lothlorien:Location {name: 'Lothlórien', type: 'Forest', realm: 'East of Misty Mountains'})
CREATE (loc_rohan:Location {name: 'Rohan', type: 'Kingdom', realm: 'Rohan'})
CREATE (loc_gondor:Location {name: 'Gondor', type: 'Kingdom', realm: 'Gondor'})
CREATE (loc_mordor:Location {name: 'Mordor', type: 'Dark Land', realm: 'Mordor'})
CREATE (loc_isengard:Location {name: 'Isengard', type: 'Fortress', realm: 'Nan Curunír'})
CREATE (loc_fangorn:Location {name: 'Fangorn Forest', type: 'Forest', realm: 'East of Misty Mountains'})
CREATE (loc_minas_tirith:Location {name: 'Minas Tirith', type: 'City', realm: 'Gondor'})
CREATE (loc_edoras:Location {name: 'Edoras', type: 'City', realm: 'Rohan'})
CREATE (loc_helms_deep:Location {name: "Helm's Deep", type: 'Fortress', realm: 'Rohan'})

// Create Characters - Fellowship
CREATE (frodo:Character {name: 'Frodo Baggins', title: 'Ring-bearer', born: 2968})
CREATE (sam:Character {name: 'Samwise Gamgee', title: 'Mayor of the Shire', born: 2980})
CREATE (merry:Character {name: 'Meriadoc Brandybuck', title: 'Master of Buckland', born: 2982})
CREATE (pippin:Character {name: 'Peregrin Took', title: 'Thain of the Shire', born: 2990})
CREATE (gandalf:Character {name: 'Gandalf', title: 'The Grey / The White', aka: 'Mithrandir'})
CREATE (aragorn:Character {name: 'Aragorn', title: 'King Elessar', born: 2931, aka: 'Strider'})
CREATE (legolas:Character {name: 'Legolas', title: 'Prince of the Woodland Realm'})
CREATE (gimli:Character {name: 'Gimli', title: 'Lord of the Glittering Caves'})
CREATE (boromir:Character {name: 'Boromir', title: 'Captain of Gondor', born: 2978, died: 3019})

// Create Characters - Other Heroes
CREATE (arwen:Character {name: 'Arwen', title: 'Evenstar', aka: 'Undómiel'})
CREATE (elrond:Character {name: 'Elrond', title: 'Lord of Rivendell', aka: 'Half-elven'})
CREATE (galadriel:Character {name: 'Galadriel', title: 'Lady of Lothlórien'})
CREATE (celeborn:Character {name: 'Celeborn', title: 'Lord of Lothlórien'})
CREATE (theoden:Character {name: 'Théoden', title: 'King of Rohan', died: 3019})
CREATE (eomer:Character {name: 'Éomer', title: 'King of Rohan'})
CREATE (eowyn:Character {name: 'Éowyn', title: 'Shield-maiden of Rohan'})
CREATE (faramir:Character {name: 'Faramir', title: 'Prince of Ithilien'})
CREATE (treebeard:Character {name: 'Treebeard', title: 'Eldest of the Ents', aka: 'Fangorn'})
CREATE (bilbo:Character {name: 'Bilbo Baggins', title: 'Burglar', born: 2890})
CREATE (gollum:Character {name: 'Gollum', aka: 'Sméagol', born: 2430})

// Create Characters - Villains
CREATE (sauron:Character {name: 'Sauron', title: 'The Dark Lord', aka: 'The Necromancer'})
CREATE (saruman:Character {name: 'Saruman', title: 'The White', aka: 'Sharkey'})
CREATE (witch_king:Character {name: 'Witch-king of Angmar', title: 'Lord of the Nazgûl'})
CREATE (grima:Character {name: 'Gríma Wormtongue', title: 'Counselor of Théoden'})

// Create Items
CREATE (one_ring:Item {name: 'The One Ring', type: 'Ring of Power', forgedBy: 'Sauron'})
CREATE (sting:Item {name: 'Sting', type: 'Sword', forgedBy: 'Elves of Gondolin'})
CREATE (glamdring:Item {name: 'Glamdring', type: 'Sword', forgedBy: 'Elves of Gondolin'})
CREATE (anduril:Item {name: 'Andúril', type: 'Sword', aka: 'Flame of the West'})
CREATE (mithril_coat:Item {name: 'Mithril Coat', type: 'Armor', forgedBy: 'Dwarves'})
CREATE (palantir:Item {name: 'Palantír', type: 'Seeing Stone', count: 7})
CREATE (phial:Item {name: 'Phial of Galadriel', type: 'Light', forgedBy: 'Galadriel'})

// Create Events
CREATE (evt_council:Event {name: 'Council of Elrond', year: 3018, location: 'Rivendell'})
CREATE (evt_moria:Event {name: 'Battle of Moria', year: 3019})
CREATE (evt_helms_deep:Event {name: "Battle of Helm's Deep", year: 3019})
CREATE (evt_pelennor:Event {name: 'Battle of the Pelennor Fields', year: 3019})
CREATE (evt_black_gate:Event {name: 'Battle of the Black Gate', year: 3019})
CREATE (evt_ring_destroyed:Event {name: 'Destruction of the One Ring', year: 3019})

// RELATIONSHIPS

// Race relationships
CREATE (frodo)-[:IS_A]->(race_hobbit)
CREATE (sam)-[:IS_A]->(race_hobbit)
CREATE (merry)-[:IS_A]->(race_hobbit)
CREATE (pippin)-[:IS_A]->(race_hobbit)
CREATE (bilbo)-[:IS_A]->(race_hobbit)
CREATE (gollum)-[:IS_A]->(race_hobbit)
CREATE (gandalf)-[:IS_A]->(race_wizard)
CREATE (saruman)-[:IS_A]->(race_wizard)
CREATE (aragorn)-[:IS_A]->(race_human)
CREATE (boromir)-[:IS_A]->(race_human)
CREATE (faramir)-[:IS_A]->(race_human)
CREATE (theoden)-[:IS_A]->(race_human)
CREATE (eomer)-[:IS_A]->(race_human)
CREATE (eowyn)-[:IS_A]->(race_human)
CREATE (grima)-[:IS_A]->(race_human)
CREATE (legolas)-[:IS_A]->(race_elf)
CREATE (arwen)-[:IS_A]->(race_elf)
CREATE (elrond)-[:IS_A]->(race_elf)
CREATE (galadriel)-[:IS_A]->(race_elf)
CREATE (celeborn)-[:IS_A]->(race_elf)
CREATE (gimli)-[:IS_A]->(race_dwarf)
CREATE (treebeard)-[:IS_A]->(race_ent)

// Home locations
CREATE (frodo)-[:LIVES_IN]->(loc_shire)
CREATE (sam)-[:LIVES_IN]->(loc_shire)
CREATE (bilbo)-[:LIVES_IN]->(loc_shire)
CREATE (elrond)-[:RULES]->(loc_rivendell)
CREATE (galadriel)-[:RULES]->(loc_lothlorien)
CREATE (celeborn)-[:RULES]->(loc_lothlorien)
CREATE (theoden)-[:RULES]->(loc_rohan)
CREATE (aragorn)-[:RULES]->(loc_gondor)
CREATE (sauron)-[:RULES]->(loc_mordor)
CREATE (saruman)-[:RULES]->(loc_isengard)
CREATE (treebeard)-[:PROTECTS]->(loc_fangorn)

// Fellowship membership
CREATE (frodo)-[:MEMBER_OF {role: 'Ring-bearer'}]->(evt_council)
CREATE (sam)-[:MEMBER_OF {role: 'Companion'}]->(evt_council)
CREATE (merry)-[:MEMBER_OF {role: 'Companion'}]->(evt_council)
CREATE (pippin)-[:MEMBER_OF {role: 'Companion'}]->(evt_council)
CREATE (gandalf)-[:MEMBER_OF {role: 'Guide'}]->(evt_council)
CREATE (aragorn)-[:MEMBER_OF {role: 'Ranger'}]->(evt_council)
CREATE (legolas)-[:MEMBER_OF {role: 'Archer'}]->(evt_council)
CREATE (gimli)-[:MEMBER_OF {role: 'Warrior'}]->(evt_council)
CREATE (boromir)-[:MEMBER_OF {role: 'Warrior'}]->(evt_council)

// Family relationships
CREATE (bilbo)-[:ADOPTED]->(frodo)
CREATE (elrond)-[:FATHER_OF]->(arwen)
CREATE (theoden)-[:UNCLE_OF]->(eomer)
CREATE (theoden)-[:UNCLE_OF]->(eowyn)
CREATE (boromir)-[:BROTHER_OF]->(faramir)
CREATE (eomer)-[:BROTHER_OF]->(eowyn)

// Romantic relationships
CREATE (aragorn)-[:LOVES]->(arwen)
CREATE (arwen)-[:LOVES]->(aragorn)
CREATE (faramir)-[:LOVES]->(eowyn)
CREATE (eowyn)-[:LOVES]->(faramir)
CREATE (sam)-[:LOVES]->(frodo)

// Friendships and alliances
CREATE (frodo)-[:FRIENDS_WITH]->(sam)
CREATE (frodo)-[:FRIENDS_WITH]->(merry)
CREATE (frodo)-[:FRIENDS_WITH]->(pippin)
CREATE (merry)-[:FRIENDS_WITH]->(pippin)
CREATE (legolas)-[:FRIENDS_WITH {since: 'Fellowship'}]->(gimli)
CREATE (gandalf)-[:MENTORS]->(frodo)
CREATE (gandalf)-[:MENTORS]->(bilbo)
CREATE (gandalf)-[:MENTORS]->(aragorn)
CREATE (galadriel)-[:ALLY_OF]->(gandalf)
CREATE (elrond)-[:ALLY_OF]->(gandalf)

// Enemy relationships
CREATE (gandalf)-[:ENEMY_OF]->(sauron)
CREATE (gandalf)-[:ENEMY_OF]->(saruman)
CREATE (aragorn)-[:ENEMY_OF]->(sauron)
CREATE (frodo)-[:ENEMY_OF]->(sauron)
CREATE (sauron)-[:CONTROLS]->(witch_king)
CREATE (saruman)-[:SERVES]->(sauron)
CREATE (grima)-[:SERVES]->(saruman)
CREATE (gollum)-[:CORRUPTED_BY]->(one_ring)

// Item ownership
CREATE (frodo)-[:CARRIES]->(one_ring)
CREATE (frodo)-[:WIELDS]->(sting)
CREATE (frodo)-[:WEARS]->(mithril_coat)
CREATE (frodo)-[:CARRIES]->(phial)
CREATE (gandalf)-[:WIELDS]->(glamdring)
CREATE (aragorn)-[:WIELDS]->(anduril)
CREATE (bilbo)-[:FOUND]->(one_ring)
CREATE (bilbo)-[:GAVE {to: 'Frodo'}]->(one_ring)
CREATE (galadriel)-[:GAVE {to: 'Frodo'}]->(phial)
CREATE (sauron)-[:CREATED]->(one_ring)

// Battle participation
CREATE (gandalf)-[:FOUGHT_IN]->(evt_moria)
CREATE (aragorn)-[:FOUGHT_IN]->(evt_helms_deep)
CREATE (legolas)-[:FOUGHT_IN]->(evt_helms_deep)
CREATE (gimli)-[:FOUGHT_IN]->(evt_helms_deep)
CREATE (theoden)-[:FOUGHT_IN]->(evt_helms_deep)
CREATE (theoden)-[:FOUGHT_IN]->(evt_pelennor)
CREATE (theoden)-[:DIED_IN]->(evt_pelennor)
CREATE (eowyn)-[:FOUGHT_IN]->(evt_pelennor)
CREATE (eowyn)-[:KILLED {victim: 'Witch-king'}]->(evt_pelennor)
CREATE (aragorn)-[:FOUGHT_IN]->(evt_black_gate)
CREATE (frodo)-[:CAUSED]->(evt_ring_destroyed)
CREATE (gollum)-[:CAUSED]->(evt_ring_destroyed)

// Location relationships
CREATE (loc_minas_tirith)-[:CAPITAL_OF]->(loc_gondor)
CREATE (loc_edoras)-[:CAPITAL_OF]->(loc_rohan)
CREATE (loc_helms_deep)-[:PART_OF]->(loc_rohan)
CREATE (loc_rivendell)-[:HIDDEN_IN]->(loc_shire);
