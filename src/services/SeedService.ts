import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Theme, CatalogItem, CatalogBadge, CatalogChest, Question } from '../types';

export const SeedService = {
  async seedAll() {
    if (!db) throw new Error('Firestore non initialisé');

    const result = {
      themes: false,
      questions: false,
      items: false,
      badges: false,
      chests: false,
    };

    try {
      await this.seedThemesAndQuestions();
      result.themes = true;
      result.questions = true;
    } catch (err) {
      console.error('seedThemesAndQuestions failed:', err);
    }

    try {
      await this.seedItems();
      result.items = true;
    } catch (err) {
      console.error('seedItems failed:', err);
    }

    try {
      await this.seedBadges();
      result.badges = true;
    } catch (err) {
      console.error('seedBadges failed:', err);
    }

    try {
      await this.seedChests();
      result.chests = true;
    } catch (err) {
      console.error('seedChests failed:', err);
    }

    console.log('Seed result:', result);

    if (!result.themes && !result.questions && !result.items && !result.badges && !result.chests) {
      throw new Error('Aucun seed n’a réussi');
    }

    return result;
  },

  async seedThemesAndQuestions() {
    const themes: Theme[] = [
      { id: 'gaming', name: 'Gaming & E-sport', questionCount: 20 },
      { id: 'pop-culture', name: 'Pop Culture', questionCount: 20 },
      { id: 'science', name: 'Science & Nature', questionCount: 20 },
      { id: 'history', name: 'Histoire', questionCount: 20 },
      { id: 'geography', name: 'Géographie', questionCount: 20 }
    ];

    const questions: (Question & { id: string })[] = [
      // Gaming (20)
      { id: 'g1', index: 0, questionId: 'g1', text: 'Quel est le premier jeu à avoir introduit le "Rocket Jump" ?', options: ['Quake', 'Doom', 'Unreal Tournament', 'Halo'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'g2', index: 1, questionId: 'g2', text: 'Dans League of Legends, quel objet a été supprimé car trop puissant sur les mages ?', options: ['DFG (Bracelet de feu mortel)', 'Rabadon', 'Zhonya', 'Luden'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'g3', index: 2, questionId: 'g3', text: 'Quel est le personnage principal de la série Zelda ?', options: ['Zelda', 'Link', 'Ganondorf', 'Sheik'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g4', index: 3, questionId: 'g4', text: 'Quel jeu a été élu jeu de l\'année aux Game Awards 2023 ?', options: ['Baldur\'s Gate 3', 'Alan Wake 2', 'Zelda: Tears of the Kingdom', 'Spider-Man 2'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'g5', index: 4, questionId: 'g5', text: 'Dans quel jeu Mario a-t-il fait sa première apparition ?', options: ['Super Mario Bros', 'Donkey Kong', 'Mario Kart', 'Punch-Out!!'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g6', index: 5, questionId: 'g6', text: 'Comment s\'appelle l\'IA qui accompagne Master Chief dans Halo ?', options: ['GLaDOS', 'Cortana', 'Siri', 'Alexa'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g7', index: 6, questionId: 'g7', text: 'Quel est le nom du fils de Kratos dans God of War (2018) ?', options: ['Atreus', 'Deimos', 'Zeus', 'Baldur'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'g8', index: 7, questionId: 'g8', text: 'Quelle est l\'IA antagoniste de la série Portal ?', options: ['HAL 9000', 'GLaDOS', 'SHODAN', 'Skynet'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g9', index: 8, questionId: 'g9', text: 'Qui est le créateur original de Minecraft ?', options: ['Jeb', 'Notch', 'Dinnerbone', 'Herobrine'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g10', index: 9, questionId: 'g10', text: 'Qui est le père biologique de Solid Snake ?', options: ['Liquid Snake', 'Big Boss', 'Revolver Ocelot', 'Otacon'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g11', index: 10, questionId: 'g11', text: 'Quel était le nom original de Pac-Man au Japon ?', options: ['Puck-Man', 'Yellow-Man', 'Dot-Man', 'Ghost-Man'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'g12', index: 11, questionId: 'g12', text: 'Quel est le nom du protagoniste de The Witcher 3 ?', options: ['Eskel', 'Lambert', 'Geralt de Riv', 'Vesemir'], correctOptionIndex: 2, timeLimit: 15, theme: 'gaming' },
      { id: 'g13', index: 12, questionId: 'g13', text: 'Quelle héroïne est sur la jaquette originale d\'Overwatch ?', options: ['Mercy', 'Tracer', 'Widowmaker', 'D.Va'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g14', index: 13, questionId: 'g14', text: 'Dans quelle province se déroule The Elder Scrolls V ?', options: ['Morrowind', 'Cyrodiil', 'Skyrim', 'Hammerfell'], correctOptionIndex: 2, timeLimit: 15, theme: 'gaming' },
      { id: 'g15', index: 14, questionId: 'g15', text: 'Comment s\'appelle le fidèle compagnon de Sonic ?', options: ['Knuckles', 'Shadow', 'Tails', 'Amy'], correctOptionIndex: 2, timeLimit: 15, theme: 'gaming' },
      { id: 'g16', index: 15, questionId: 'g16', text: 'Dans quelle ville se déroule la majorité de Resident Evil 2 ?', options: ['Silent Hill', 'Raccoon City', 'Liberty City', 'Vice City'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g17', index: 16, questionId: 'g17', text: 'Comment s\'appelle la mascotte de la série Fallout ?', options: ['Pip-Boy', 'Vault-Boy', 'Nuka-Man', 'Power-Suit'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g18', index: 17, questionId: 'g18', text: 'Quel est le protagoniste principal de Street Fighter ?', options: ['Ken', 'Ryu', 'Chun-Li', 'Guile'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },
      { id: 'g19', index: 18, questionId: 'g19', text: 'Quel studio a développé la série Dark Souls ?', options: ['FromSoftware', 'Capcom', 'Square Enix', 'PlatinumGames'], correctOptionIndex: 0, timeLimit: 15, theme: 'gaming' },
      { id: 'g20', index: 19, questionId: 'g20', text: 'Qui a créé le jeu Tetris ?', options: ['Shigeru Miyamoto', 'Alexey Pajitnov', 'Hideo Kojima', 'John Carmack'], correctOptionIndex: 1, timeLimit: 15, theme: 'gaming' },

      // Pop Culture (20)
      { id: 'p1', index: 0, questionId: 'p1', text: 'Quel est le nom du dragon dans Le Hobbit ?', options: ['Smaug', 'Alduin', 'Paarthurnax', 'Viserion'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p2', index: 1, questionId: 'p2', text: 'Qui est l\'interprète de "Thriller" ?', options: ['Prince', 'Michael Jackson', 'Madonna', 'Freddie Mercury'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p3', index: 2, questionId: 'p3', text: 'Quelle série met en scène Walter White ?', options: ['Better Call Saul', 'Breaking Bad', 'The Wire', 'Sopranos'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p4', index: 3, questionId: 'p4', text: 'Quel est le vrai nom d\'Iron Man ?', options: ['Steve Rogers', 'Tony Stark', 'Bruce Banner', 'Clark Kent'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p5', index: 4, questionId: 'p5', text: 'Dans quelle ville imaginaire vit Batman ?', options: ['Metropolis', 'Gotham City', 'Central City', 'Star City'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p6', index: 5, questionId: 'p6', text: 'Quel est le vrai nom de Dark Vador ?', options: ['Luke Skywalker', 'Anakin Skywalker', 'Obi-Wan Kenobi', 'Palpatine'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p7', index: 6, questionId: 'p7', text: 'Comment s\'appelle la chouette de Harry Potter ?', options: ['Croûtard', 'Hedwige', 'Pattenrond', 'Buck'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p8', index: 7, questionId: 'p8', text: 'Quel est le nom du café dans la série Friends ?', options: ['Central Perk', 'Starbucks', 'The Coffee Bean', 'Monk\'s Diner'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p9', index: 8, questionId: 'p9', text: 'Sur quel continent se déroule Game of Thrones ?', options: ['Essos', 'Westeros', 'Sothoryos', 'Ulthos'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p10', index: 9, questionId: 'p10', text: 'Comment s\'appelle l\'oncle de Peter Parker ?', options: ['Oncle Ben', 'Oncle Sam', 'Oncle Tom', 'Oncle Phil'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p11', index: 10, questionId: 'p11', text: 'Quel est le matricule de James Bond ?', options: ['001', '007', '009', '700'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p12', index: 11, questionId: 'p12', text: 'Qui a réalisé le film Titanic (1997) ?', options: ['Steven Spielberg', 'James Cameron', 'Christopher Nolan', 'Martin Scorsese'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p13', index: 12, questionId: 'p13', text: 'Dans quelle ville se déroule Stranger Things ?', options: ['Hawkins', 'Derry', 'Castle Rock', 'Twin Peaks'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p14', index: 13, questionId: 'p14', text: 'Quelle pilule Neo choisit-il dans Matrix ?', options: ['La bleue', 'La rouge', 'La verte', 'La jaune'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p15', index: 14, questionId: 'p15', text: 'Comment s\'appelle le père dans Les Simpson ?', options: ['Bart', 'Ned', 'Homer', 'Barney'], correctOptionIndex: 2, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p16', index: 15, questionId: 'p16', text: 'Qui est le créateur de Star Wars ?', options: ['George Lucas', 'Steven Spielberg', 'J.J. Abrams', 'Ridley Scott'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p17', index: 16, questionId: 'p17', text: 'Pour quoi Stan Lee était-il célèbre dans les films Marvel ?', options: ['Ses caméos', 'Sa réalisation', 'Ses cascades', 'Ses costumes'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p18', index: 17, questionId: 'p18', text: 'Qui a réalisé Pulp Fiction ?', options: ['Quentin Tarantino', 'Guy Ritchie', 'Robert Rodriguez', 'David Fincher'], correctOptionIndex: 0, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p19', index: 18, questionId: 'p19', text: 'Quelle est la profession d\'Indiana Jones ?', options: ['Historien', 'Archéologue', 'Explorateur', 'Professeur de sport'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },
      { id: 'p20', index: 19, questionId: 'p20', text: 'Comment s\'appelle l\'anneau unique dans Le Seigneur des Anneaux ?', options: ['L\'Anneau de Pouvoir', 'L\'Anneau Unique', 'Le Précieux', 'L\'Anneau de Sauron'], correctOptionIndex: 1, timeLimit: 15, theme: 'pop-culture' },

      // Science (20)
      { id: 's1', index: 0, questionId: 's1', text: 'Quelle est la planète la plus proche du Soleil ?', options: ['Vénus', 'Terre', 'Mercure', 'Mars'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's2', index: 1, questionId: 's2', text: 'Quel élément chimique a pour symbole "O" ?', options: ['Or', 'Oxygène', 'Osmium', 'Oganesson'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's3', index: 2, questionId: 's3', text: 'Combien de cœurs possède une pieuvre ?', options: ['1', '2', '3', '4'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's4', index: 3, questionId: 's4', text: 'Quelle est la formule chimique de l\'eau ?', options: ['CO2', 'H2O', 'NaCl', 'CH4'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's5', index: 4, questionId: 's5', text: 'Quelle est approximativement la vitesse de la lumière ?', options: ['300 000 km/s', '150 000 km/s', '1 000 000 km/s', '340 m/s'], correctOptionIndex: 0, timeLimit: 15, theme: 'science' },
      { id: 's6', index: 5, questionId: 's6', text: 'Qui a été le premier homme à marcher sur la Lune ?', options: ['Buzz Aldrin', 'Yuri Gagarine', 'Neil Armstrong', 'John Glenn'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's7', index: 6, questionId: 's7', text: 'Quelle est la forme de la molécule d\'ADN ?', options: ['Sphère', 'Double hélice', 'Cube', 'Pyramide'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's8', index: 7, questionId: 's8', text: 'Quelle est la plus grande planète du système solaire ?', options: ['Saturne', 'Neptune', 'Jupiter', 'Uranus'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's9', index: 8, questionId: 's9', text: 'Quelle planète est surnommée la planète rouge ?', options: ['Vénus', 'Mars', 'Jupiter', 'Mercure'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's10', index: 9, questionId: 's10', text: 'Qui a découvert la loi de la gravitation universelle ?', options: ['Galilée', 'Isaac Newton', 'Albert Einstein', 'Copernic'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's11', index: 10, questionId: 's11', text: 'Qui a formulé la théorie de la relativité ?', options: ['Stephen Hawking', 'Marie Curie', 'Albert Einstein', 'Niels Bohr'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's12', index: 11, questionId: 's12', text: 'Qui a créé le premier tableau périodique des éléments ?', options: ['Dimitri Mendeleïev', 'Antoine Lavoisier', 'Robert Boyle', 'John Dalton'], correctOptionIndex: 0, timeLimit: 15, theme: 'science' },
      { id: 's13', index: 12, questionId: 's13', text: 'Combien d\'os possède un corps humain adulte ?', options: ['106', '206', '306', '406'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's14', index: 13, questionId: 's14', text: 'Quelle est la planète la plus chaude du système solaire ?', options: ['Mercure', 'Vénus', 'Mars', 'Jupiter'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's15', index: 14, questionId: 's15', text: 'Quel gaz utilise-t-on pour faire flotter les ballons ?', options: ['Azote', 'Oxygène', 'Hélium', 'Hydrogène'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's16', index: 15, questionId: 's16', text: 'Comment appelle-t-on l\'étude des plantes ?', options: ['Zoologie', 'Botanique', 'Géologie', 'Astronomie'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },
      { id: 's17', index: 16, questionId: 's17', text: 'Quelle est la plus petite unité structurelle de la vie ?', options: ['Atome', 'Molécule', 'Cellule', 'Organe'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's18', index: 17, questionId: 's18', text: 'Quel organite est la "centrale énergétique" de la cellule ?', options: ['Noyau', 'Ribosome', 'Mitochondrie', 'Appareil de Golgi'], correctOptionIndex: 2, timeLimit: 15, theme: 'science' },
      { id: 's19', index: 18, questionId: 's19', text: 'De quel élément chimique est composé le diamant ?', options: ['Carbone', 'Silicium', 'Fer', 'Azote'], correctOptionIndex: 0, timeLimit: 15, theme: 'science' },
      { id: 's20', index: 19, questionId: 's20', text: 'Quel est le seul satellite naturel de la Terre ?', options: ['Le Soleil', 'La Lune', 'Mars', 'Vénus'], correctOptionIndex: 1, timeLimit: 15, theme: 'science' },

      // History (20)
      { id: 'h1', index: 0, questionId: 'h1', text: 'En quelle année a eu lieu la Révolution française ?', options: ['1789', '1815', '1792', '1804'], correctOptionIndex: 0, timeLimit: 15, theme: 'history' },
      { id: 'h2', index: 1, questionId: 'h2', text: 'Qui était le premier président des États-Unis ?', options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'Benjamin Franklin'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h3', index: 2, questionId: 'h3', text: 'Quelle civilisation a construit les pyramides de Gizeh ?', options: ['Grecque', 'Romaine', 'Égyptienne', 'Mésopotamienne'], correctOptionIndex: 2, timeLimit: 15, theme: 'history' },
      { id: 'h4', index: 3, questionId: 'h4', text: 'Où Napoléon a-t-il subi sa défaite finale ?', options: ['Austerlitz', 'Waterloo', 'Iéna', 'Trafalgar'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h5', index: 4, questionId: 'h5', text: 'En quelle année a commencé la Première Guerre mondiale ?', options: ['1912', '1914', '1916', '1918'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h6', index: 5, questionId: 'h6', text: 'En quelle année s\'est terminée la Seconde Guerre mondiale ?', options: ['1943', '1944', '1945', '1946'], correctOptionIndex: 2, timeLimit: 15, theme: 'history' },
      { id: 'h7', index: 6, questionId: 'h7', text: 'En quelle année est tombé le mur de Berlin ?', options: ['1987', '1988', '1989', '1990'], correctOptionIndex: 2, timeLimit: 15, theme: 'history' },
      { id: 'h8', index: 7, questionId: 'h8', text: 'Qui est considéré comme le fondateur de l\'Empire romain ?', options: ['Jules César', 'Auguste', 'Néron', 'Caligula'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h9', index: 8, questionId: 'h9', text: 'Quelle héroïne a aidé à libérer Orléans pendant la guerre de Cent Ans ?', options: ['Jeanne d\'Arc', 'Aliénor d\'Aquitaine', 'Catherine de Médicis', 'Marie-Antoinette'], correctOptionIndex: 0, timeLimit: 15, theme: 'history' },
      { id: 'h10', index: 9, questionId: 'h10', text: 'En quelle année la Magna Carta a-t-elle été signée ?', options: ['1066', '1215', '1492', '1776'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h11', index: 10, questionId: 'h11', text: 'En quelle année Christophe Colomb est-il arrivé en Amérique ?', options: ['1482', '1492', '1502', '1512'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h12', index: 11, questionId: 'h12', text: 'Où a commencé la Révolution industrielle ?', options: ['France', 'États-Unis', 'Grande-Bretagne', 'Allemagne'], correctOptionIndex: 2, timeLimit: 15, theme: 'history' },
      { id: 'h13', index: 12, questionId: 'h13', text: 'Au quel siècle la Peste Noire a-t-elle ravagé l\'Europe ?', options: ['12ème', '13ème', '14ème', '15ème'], correctOptionIndex: 2, timeLimit: 15, theme: 'history' },
      { id: 'h14', index: 13, questionId: 'h14', text: 'Comment appelait-on les guerriers de l\'ancien Japon ?', options: ['Ninjas', 'Samouraïs', 'Shoguns', 'Ronins'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h15', index: 14, questionId: 'h15', text: 'Qui était le leader de la lutte contre l\'apartheid en Afrique du Sud ?', options: ['Desmond Tutu', 'Nelson Mandela', 'Steve Biko', 'Kofi Annan'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h16', index: 15, questionId: 'h16', text: 'Qui est l\'auteur de "La Joconde" ?', options: ['Michel-Ange', 'Raphaël', 'Léonard de Vinci', 'Donatello'], correctOptionIndex: 2, timeLimit: 15, theme: 'history' },
      { id: 'h17', index: 16, questionId: 'h17', text: 'Quels étaient les deux principaux blocs de la Guerre Froide ?', options: ['USA vs Chine', 'USA vs URSS', 'France vs Allemagne', 'UK vs USA'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h18', index: 17, questionId: 'h18', text: 'En quelle année le Titanic a-t-il coulé ?', options: ['1910', '1912', '1914', '1916'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h19', index: 18, questionId: 'h19', text: 'Quel roi de France était surnommé le "Roi-Soleil" ?', options: ['Louis XIII', 'Louis XIV', 'Louis XV', 'Louis XVI'], correctOptionIndex: 1, timeLimit: 15, theme: 'history' },
      { id: 'h20', index: 19, questionId: 'h20', text: 'Qui a été la première femme à recevoir un prix Nobel ?', options: ['Marie Curie', 'Rosalind Franklin', 'Ada Lovelace', 'Dorothy Hodgkin'], correctOptionIndex: 0, timeLimit: 15, theme: 'history' },

      // Geography (20)
      { id: 'geo1', index: 0, questionId: 'geo1', text: 'Quel est le plus grand océan du monde ?', options: ['Atlantique', 'Indien', 'Arctique', 'Pacifique'], correctOptionIndex: 3, timeLimit: 15, theme: 'geography' },
      { id: 'geo2', index: 1, questionId: 'geo2', text: 'Quel est le plus haut sommet du monde ?', options: ['K2', 'Mont Blanc', 'Everest', 'Kilimandjaro'], correctOptionIndex: 2, timeLimit: 15, theme: 'geography' },
      { id: 'geo3', index: 2, questionId: 'geo3', text: 'Quel est le plus long fleuve du monde ?', options: ['Nil', 'Amazone', 'Mississippi', 'Yangtsé'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo4', index: 3, questionId: 'geo4', text: 'Quelle est la capitale du Japon ?', options: ['Kyoto', 'Osaka', 'Tokyo', 'Hiroshima'], correctOptionIndex: 2, timeLimit: 15, theme: 'geography' },
      { id: 'geo5', index: 4, questionId: 'geo5', text: 'Quel est le plus petit pays du monde ?', options: ['Monaco', 'Vatican', 'Saint-Marin', 'Liechtenstein'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo6', index: 5, questionId: 'geo6', text: 'Quel est le plus grand pays du monde par sa superficie ?', options: ['Canada', 'Chine', 'USA', 'Russie'], correctOptionIndex: 3, timeLimit: 15, theme: 'geography' },
      { id: 'geo7', index: 6, questionId: 'geo7', text: 'Sur quel continent se trouve le désert du Sahara ?', options: ['Asie', 'Afrique', 'Amérique', 'Océanie'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo8', index: 7, questionId: 'geo8', text: 'Quelle est la capitale de la France ?', options: ['Lyon', 'Marseille', 'Paris', 'Bordeaux'], correctOptionIndex: 2, timeLimit: 15, theme: 'geography' },
      { id: 'geo9', index: 8, questionId: 'geo9', text: 'Dans quel pays se trouve la Grande Muraille ?', options: ['Japon', 'Chine', 'Corée', 'Vietnam'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo10', index: 9, questionId: 'geo10', text: 'Quel pays est aussi un continent ?', options: ['Brésil', 'Australie', 'Inde', 'Canada'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo11', index: 10, questionId: 'geo11', text: 'Quelle est la capitale de l\'Italie ?', options: ['Milan', 'Venise', 'Rome', 'Florence'], correctOptionIndex: 2, timeLimit: 15, theme: 'geography' },
      { id: 'geo12', index: 11, questionId: 'geo12', text: 'Quel est le point le plus profond des océans ?', options: ['Fosse des Mariannes', 'Fosse de Porto Rico', 'Fosse de Java', 'Fosse des Tonga'], correctOptionIndex: 0, timeLimit: 15, theme: 'geography' },
      { id: 'geo13', index: 12, questionId: 'geo13', text: 'Dans quel pays se trouve la majeure partie de la forêt amazonienne ?', options: ['Pérou', 'Colombie', 'Brésil', 'Venezuela'], correctOptionIndex: 2, timeLimit: 15, theme: 'geography' },
      { id: 'geo14', index: 13, questionId: 'geo14', text: 'Quelle est la capitale du Canada ?', options: ['Toronto', 'Vancouver', 'Montréal', 'Ottawa'], correctOptionIndex: 3, timeLimit: 15, theme: 'geography' },
      { id: 'geo15', index: 14, questionId: 'geo15', text: 'Quel pays est surnommé le pays du Soleil Levant ?', options: ['Chine', 'Japon', 'Thaïlande', 'Corée'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo16', index: 15, questionId: 'geo16', text: 'Dans quel pays se trouvent les pyramides de Gizeh ?', options: ['Maroc', 'Tunisie', 'Égypte', 'Soudan'], correctOptionIndex: 2, timeLimit: 15, theme: 'geography' },
      { id: 'geo17', index: 16, questionId: 'geo17', text: 'Dans quelle ville se trouve la tour Eiffel ?', options: ['Londres', 'Berlin', 'Paris', 'Madrid'], correctOptionIndex: 2, timeLimit: 15, theme: 'geography' },
      { id: 'geo18', index: 17, questionId: 'geo18', text: 'Dans quelle ville se trouve la Statue de la Liberté ?', options: ['Washington', 'New York', 'Los Angeles', 'Chicago'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo19', index: 18, questionId: 'geo19', text: 'Entre quels pays se trouve la mer Morte ?', options: ['Égypte et Libye', 'Jordanie et Israël', 'Grèce et Turquie', 'Italie et Tunisie'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' },
      { id: 'geo20', index: 19, questionId: 'geo20', text: 'Dans quel pays se trouve le mont Fuji ?', options: ['Chine', 'Japon', 'Népal', 'Inde'], correctOptionIndex: 1, timeLimit: 15, theme: 'geography' }
    ];

    const batch = writeBatch(db);

    for (const theme of themes) {
      batch.set(doc(db, 'themes', theme.id), theme);
    }

    for (const q of questions) {
      batch.set(doc(db, 'questionBank', q.id), q);
    }

    await batch.commit();
    console.log('Themes + questions seeded');
  },

  async seedItems() {
    const now = Date.now();

    const items: CatalogItem[] = [
      {
        id: 'spell_flashbang',
        name: 'Flashbang',
        description: 'Éblouit un adversaire : son écran devient blanc pendant 5 secondes.',
        price: 150,
        currency: 'coins',
        icon: 'Zap',
        type: 'spell',
        power: 3,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'spell_freeze',
        name: 'Gel Temporel',
        description: 'Bloque les réponses d’un adversaire pendant 3 secondes.',
        price: 200,
        currency: 'coins',
        icon: 'Snowflake',
        type: 'spell',
        power: 4,
        chestOnly: true,
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'spell_shield',
        name: 'Bouclier de Mana',
        description: 'Protège contre le prochain sort lancé contre vous.',
        price: 100,
        currency: 'coins',
        icon: 'Shield',
        type: 'defense',
        power: 2,
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    const batch = writeBatch(db);
    for (const item of items) {
      batch.set(doc(db, 'catalogItems', item.id), item);
    }
    await batch.commit();
    console.log('Items seeded');
  },

  async seedBadges() {
    const badges: CatalogBadge[] = [
      { id: 'b_speed', name: 'Éclair', description: 'Répondre correctement en moins de 1 seconde.', icon: 'Zap' },
      { id: 'b_win', name: 'Champion', description: 'Gagner 10 quiz.', icon: 'Trophy' }
    ];

    const batch = writeBatch(db);
    for (const badge of badges) {
      batch.set(doc(db, 'catalogBadges', badge.id), badge);
    }
    await batch.commit();
    console.log('Badges seeded');
  },

  async seedChests() {
    const chests: CatalogChest[] = [
      {
        id: 'chest_common',
        name: 'Coffre en Bois',
        description: 'Contient des sorts de base.',
        price: 50,
        currency: 'coins',
        icon: 'Package',
        possibleItems: ['spell_shield', 'spell_flashbang'],
        rarity: 'common',
        active: true
      }
    ];

    const batch = writeBatch(db);
    for (const chest of chests) {
      batch.set(doc(db, 'catalogChests', chest.id), chest);
    }
    await batch.commit();
    console.log('Chests seeded');
  }
};
