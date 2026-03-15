import React from 'react';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Info } from 'lucide-react';

export default function Rules() {
  return (
    <PageLayout>
      <PageHeader
        title="Règles du Jeu"
        subtitle="Comment jouer à BrainClash"
        icon={<Info className="w-8 h-8 text-blue-500" />}
      />

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
        <section>
          <h3 className="text-xl font-bold text-white mb-4">1. Le But du Jeu</h3>
          <p className="text-zinc-400">
            BrainClash est un quiz compétitif en temps réel. Répondez aux questions le plus rapidement possible pour accumuler des points et grimper dans le classement.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-4">2. Système de Score</h3>
          <p className="text-zinc-400">
            Chaque bonne réponse vous rapporte des points de base. Plus vous répondez vite, plus vous gagnez de points bonus de rapidité !
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-4">3. Objets et Sorts</h3>
          <p className="text-zinc-400">
            Utilisez les objets de votre inventaire pour perturber vos adversaires ou vous protéger. Vous pouvez en acheter dans la boutique avec vos pièces gagnées en jeu.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-4">4. Respect</h3>
          <p className="text-zinc-400">
            Restez fair-play. Tout comportement toxique pourra entraîner une exclusion temporaire ou définitive.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
