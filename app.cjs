// Point d'entrée pour l'hébergement Hostinger (Phusion Passenger)
process.env.NODE_ENV = 'production';
require('./dist-server/index.cjs');
