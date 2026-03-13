import { pool, initDB } from '../src/lib/db.js';
import { v4 as uuidv4 } from 'uuid';

const themes = [
  { id: 'general', name: 'Culture Générale' },
  { id: 'gaming', name: 'Jeux Vidéo' },
  { id: 'science', name: 'Science & Nature' },
  { id: 'cinema', name: 'Cinéma & Séries' },
  { id: 'histoire', name: 'Histoire' }
];

const questions = [
  // Culture Générale
  { theme_id: 'general', text: 'Quelle est la capitale de la France ?', options: ['Lyon', 'Marseille', 'Paris', 'Bordeaux'], correctOptionIndex: 2 },
  { theme_id: 'general', text: 'Qui a écrit "Les Misérables" ?', options: ['Emile Zola', 'Victor Hugo', 'Molière', 'Albert Camus'], correctOptionIndex: 1 },
  { theme_id: 'general', text: 'Quel est le plus grand océan du monde ?', options: ['Océan Atlantique', 'Océan Indien', 'Océan Arctique', 'Océan Pacifique'], correctOptionIndex: 3 },
  { theme_id: 'general', text: 'Combien de continents y a-t-il sur Terre ?', options: ['5', '6', '7', '8'], correctOptionIndex: 2 },
  { theme_id: 'general', text: 'Quelle est la monnaie du Japon ?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], correctOptionIndex: 2 },
  { theme_id: 'general', text: 'Quel est le plus long fleuve du monde ?', options: ['Nil', 'Amazone', 'Yangtsé', 'Mississippi'], correctOptionIndex: 1 },
  { theme_id: 'general', text: 'En quelle année a eu lieu la Révolution française ?', options: ['1789', '1799', '1889', '1689'], correctOptionIndex: 0 },
  { theme_id: 'general', text: 'Quel est le symbole chimique de l\'or ?', options: ['Ag', 'Au', 'Fe', 'Cu'], correctOptionIndex: 1 },
  { theme_id: 'general', text: 'Qui a peint La Joconde ?', options: ['Vincent van Gogh', 'Pablo Picasso', 'Léonard de Vinci', 'Claude Monet'], correctOptionIndex: 2 },
  { theme_id: 'general', text: 'Quel est le plus grand pays du monde par sa superficie ?', options: ['Canada', 'Chine', 'États-Unis', 'Russie'], correctOptionIndex: 3 },

  // Jeux Vidéo
  { theme_id: 'gaming', text: 'Quel est le jeu vidéo le plus vendu de tous les temps ?', options: ['Minecraft', 'GTA V', 'Tetris', 'Wii Sports'], correctOptionIndex: 0 },
  { theme_id: 'gaming', text: 'Qui est le héros de la série The Legend of Zelda ?', options: ['Zelda', 'Link', 'Ganon', 'Luigi'], correctOptionIndex: 1 },
  { theme_id: 'gaming', text: 'Dans quel jeu trouve-t-on la carte "De Dust2" ?', options: ['Call of Duty', 'Valorant', 'Counter-Strike', 'Overwatch'], correctOptionIndex: 2 },
  { theme_id: 'gaming', text: 'Quelle entreprise a créé la console PlayStation ?', options: ['Microsoft', 'Nintendo', 'Sega', 'Sony'], correctOptionIndex: 3 },
  { theme_id: 'gaming', text: 'Quel est le nom du frère de Mario ?', options: ['Wario', 'Luigi', 'Waluigi', 'Toad'], correctOptionIndex: 1 },
  { theme_id: 'gaming', text: 'Dans quel jeu doit-on construire des structures pour se protéger la nuit ?', options: ['Fortnite', 'Rust', 'Minecraft', 'Terraria'], correctOptionIndex: 2 },
  { theme_id: 'gaming', text: 'Quel studio a développé "The Witcher 3" ?', options: ['Bethesda', 'BioWare', 'CD Projekt Red', 'Ubisoft'], correctOptionIndex: 2 },
  { theme_id: 'gaming', text: 'Quel est le nom de la princesse dans Mario ?', options: ['Daisy', 'Peach', 'Rosalina', 'Zelda'], correctOptionIndex: 1 },
  { theme_id: 'gaming', text: 'Dans quel jeu incarne-t-on Kratos ?', options: ['God of War', 'Halo', 'Gears of War', 'Devil May Cry'], correctOptionIndex: 0 },
  { theme_id: 'gaming', text: 'Quel jeu a popularisé le genre Battle Royale ?', options: ['Apex Legends', 'PUBG', 'Fortnite', 'H1Z1'], correctOptionIndex: 1 },

  // Science & Nature
  { theme_id: 'science', text: 'Quelle est la planète la plus proche du Soleil ?', options: ['Vénus', 'Mars', 'Mercure', 'Jupiter'], correctOptionIndex: 2 },
  { theme_id: 'science', text: 'Quel est l\'élément le plus abondant dans l\'univers ?', options: ['Oxygène', 'Carbone', 'Hélium', 'Hydrogène'], correctOptionIndex: 3 },
  { theme_id: 'science', text: 'Combien d\'os y a-t-il dans le corps humain adulte ?', options: ['206', '216', '196', '226'], correctOptionIndex: 0 },
  { theme_id: 'science', text: 'Quelle est la vitesse de la lumière ?', options: ['300 000 km/s', '150 000 km/s', '400 000 km/s', '1 000 000 km/s'], correctOptionIndex: 0 },
  { theme_id: 'science', text: 'Qui a formulé la théorie de la relativité ?', options: ['Isaac Newton', 'Galilée', 'Albert Einstein', 'Nikola Tesla'], correctOptionIndex: 2 },
  { theme_id: 'science', text: 'Quel est le gaz que les plantes absorbent pour la photosynthèse ?', options: ['Oxygène', 'Azote', 'Dioxyde de carbone', 'Monoxyde de carbone'], correctOptionIndex: 2 },
  { theme_id: 'science', text: 'Quel est l\'animal terrestre le plus rapide ?', options: ['Guépard', 'Lion', 'Léopard', 'Antilope'], correctOptionIndex: 0 },
  { theme_id: 'science', text: 'Combien de cœurs a une pieuvre ?', options: ['1', '2', '3', '4'], correctOptionIndex: 2 },
  { theme_id: 'science', text: 'Quelle est la température d\'ébullition de l\'eau au niveau de la mer ?', options: ['90°C', '100°C', '110°C', '120°C'], correctOptionIndex: 1 },
  { theme_id: 'science', text: 'Quel est le plus grand organe du corps humain ?', options: ['Le foie', 'Le cerveau', 'La peau', 'Les poumons'], correctOptionIndex: 2 },

  // Cinéma & Séries
  { theme_id: 'cinema', text: 'Qui a réalisé le film "Inception" ?', options: ['Steven Spielberg', 'Christopher Nolan', 'Quentin Tarantino', 'Martin Scorsese'], correctOptionIndex: 1 },
  { theme_id: 'cinema', text: 'Quel acteur joue Iron Man dans le MCU ?', options: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correctOptionIndex: 2 },
  { theme_id: 'cinema', text: 'Dans quelle série trouve-t-on le personnage de Walter White ?', options: ['The Wire', 'Breaking Bad', 'Mad Men', 'Les Soprano'], correctOptionIndex: 1 },
  { theme_id: 'cinema', text: 'Quel film a remporté l\'Oscar du meilleur film en 1998 ?', options: ['Titanic', 'Gladiator', 'Forrest Gump', 'Braveheart'], correctOptionIndex: 0 },
  { theme_id: 'cinema', text: 'Qui est le créateur de Star Wars ?', options: ['J.J. Abrams', 'George Lucas', 'Peter Jackson', 'James Cameron'], correctOptionIndex: 1 },
  { theme_id: 'cinema', text: 'Dans quel film entend-on "Je suis le roi du monde !" ?', options: ['Le Roi Lion', 'Titanic', 'Gladiator', 'Avatar'], correctOptionIndex: 1 },
  { theme_id: 'cinema', text: 'Quelle actrice joue Hermione Granger dans Harry Potter ?', options: ['Emma Stone', 'Emma Watson', 'Natalie Portman', 'Keira Knightley'], correctOptionIndex: 1 },
  { theme_id: 'cinema', text: 'Combien y a-t-il de films dans la trilogie originale du Seigneur des Anneaux ?', options: ['2', '3', '4', '5'], correctOptionIndex: 1 },
  { theme_id: 'cinema', text: 'Quel est le nom du robot dans Wall-E ?', options: ['R2-D2', 'C-3PO', 'Wall-E', 'EVE'], correctOptionIndex: 2 },
  { theme_id: 'cinema', text: 'Dans quelle ville se déroule la série "Stranger Things" ?', options: ['Hawkins', 'Riverdale', 'Sunnydale', 'Twin Peaks'], correctOptionIndex: 0 },

  // Histoire
  { theme_id: 'histoire', text: 'Qui était le premier président des États-Unis ?', options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'John Adams'], correctOptionIndex: 2 },
  { theme_id: 'histoire', text: 'En quelle année a commencé la Première Guerre mondiale ?', options: ['1912', '1914', '1916', '1918'], correctOptionIndex: 1 },
  { theme_id: 'histoire', text: 'Quel pharaon a fait construire la plus grande pyramide de Gizeh ?', options: ['Khéops', 'Toutânkhamon', 'Ramsès II', 'Cléopâtre'], correctOptionIndex: 0 },
  { theme_id: 'histoire', text: 'Qui a découvert l\'Amérique en 1492 ?', options: ['Vasco de Gama', 'Christophe Colomb', 'Magellan', 'Marco Polo'], correctOptionIndex: 1 },
  { theme_id: 'histoire', text: 'Quel mur est tombé en 1989 ?', options: ['Le mur de Berlin', 'La Grande Muraille de Chine', 'Le mur d\'Hadrien', 'Le mur des Lamentations'], correctOptionIndex: 0 },
  { theme_id: 'histoire', text: 'Qui était la reine de France lors de la Révolution française ?', options: ['Catherine de Médicis', 'Marie-Antoinette', 'Anne d\'Autriche', 'Aliénor d\'Aquitaine'], correctOptionIndex: 1 },
  { theme_id: 'histoire', text: 'Dans quelle ville a été signé le traité mettant fin à la Première Guerre mondiale ?', options: ['Londres', 'Berlin', 'Versailles', 'Vienne'], correctOptionIndex: 2 },
  { theme_id: 'histoire', text: 'Quel empereur romain a légalisé le christianisme ?', options: ['Néron', 'Auguste', 'Constantin', 'Jules César'], correctOptionIndex: 2 },
  { theme_id: 'histoire', text: 'Qui a été le premier homme à marcher sur la Lune ?', options: ['Yuri Gagarin', 'Buzz Aldrin', 'Neil Armstrong', 'Michael Collins'], correctOptionIndex: 2 },
  { theme_id: 'histoire', text: 'Quelle civilisation a construit le Machu Picchu ?', options: ['Les Mayas', 'Les Aztèques', 'Les Incas', 'Les Olmèques'], correctOptionIndex: 2 }
];

async function seed() {
  try {
    console.log('Initialisation de la base de données...');
    await initDB();

    console.log('Suppression des anciennes questions par défaut...');
    await pool.query('DELETE FROM questions WHERE is_custom = FALSE');

    console.log('Insertion des thèmes...');
    for (const theme of themes) {
      await pool.query('INSERT IGNORE INTO themes (id, name) VALUES (?, ?)', [theme.id, theme.name]);
    }
    
    console.log('Insertion des questions...');
    for (const q of questions) {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO questions (id, theme_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, q.theme_id, q.text, JSON.stringify(q.options), q.correctOptionIndex, 15, false]
      );
    }
    
    console.log('Base de données initialisée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

seed();
