import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Check, X, Inbox, User } from 'lucide-react';
import { SubmittedQuestion, Theme } from '../types';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function ReviewQuestions() {
  const [questions, setQuestions] = useState<SubmittedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<Record<string, Theme>>({});

  useEffect(() => {
    const unsubscribeQuestions = onSnapshot(collection(db, 'pendingQuestions'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubmittedQuestion));
      setQuestions(list);
      setLoading(false);
    }, (err) => {
      console.error('Pending questions error:', err);
      setLoading(false);
    });

    const unsubscribeThemes = onSnapshot(collection(db, 'themes'), (snapshot) => {
      const themesMap: Record<string, Theme> = {};
      snapshot.docs.forEach(doc => {
        const theme = doc.data() as Theme;
        themesMap[doc.id] = theme;
      });
      setThemes(themesMap);
    }, (err) => {
      console.error('Themes error:', err);
    });

    return () => {
      unsubscribeQuestions();
      unsubscribeThemes();
    };
  }, []);

  const handleReview = async (id: string, action: 'approve' | 'reject', theme: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    if (action === 'approve') {
      // Add to approved questions collection
      const question = questions.find(q => q.id === id);
      if (question) {
        await addDoc(collection(db, 'questions'), { ...question, approvedBy: user.displayName || 'Admin' });
      }
    }
    
    // Delete from pending
    await deleteDoc(doc(db, 'pendingQuestions', id));
  };

  return (
    <PageLayout maxWidth="max-w-4xl">
      <PageHeader
        title="Vérification des questions"
        subtitle="Validez les questions proposées par la communauté"
        icon={<Inbox className="w-8 h-8 text-blue-500" />}
      />

      <div className="pr-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center">
            <Inbox className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Aucune question en attente</h2>
            <p className="text-zinc-400">Vos abonnés n'ont pas encore proposé de nouvelles questions.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {questions.map((q) => (
              <Card key={q.id} className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <Badge variant="fuchsia">
                      {themes[q.theme]?.name || q.theme}
                    </Badge>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Proposé par <strong className="text-zinc-300">{q.author}</strong>
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-4">{q.text}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q?.options?.map((opt, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border ${i === q.correctOptionIndex ? 'bg-green-500/10 border-green-500/50 text-green-400 font-bold' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'}`}
                      >
                        {i === q.correctOptionIndex && <Check className="w-4 h-4 inline-block mr-2" />}
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 justify-center md:border-l border-zinc-800 md:pl-6">
                  <Button
                    onClick={() => handleReview(q.id, 'approve', q.theme)}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white"
                  >
                    <Check className="w-5 h-5" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handleReview(q.id, 'reject', q.theme)}
                    variant="danger"
                    className="flex-1 md:flex-none"
                  >
                    <X className="w-5 h-5" />
                    Rejeter
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
