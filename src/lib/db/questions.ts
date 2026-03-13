import { query } from './core';
import type { SubmittedQuestion, Question, Theme } from '../../types';

export async function getThemesWithQuestions(): Promise<Record<string, Theme>> {
  try {
    const categories = await query('SELECT * FROM categories');
    const questions = await query('SELECT * FROM questions');
    
    const themes: Record<string, Theme> = {};
    
    for (const cat of categories) {
      themes[cat.name] = {
        id: cat.id,
        name: cat.name,
        questions: questions
          .filter((q: any) => q.category_id === cat.id)
          .map((q: any) => ({
            id: q.id,
            text: q.text,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            correctOptionIndex: q.correctOptionIndex,
            timeLimit: q.timeLimit
          }))
      };
    }
    
    return themes;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {};
  }
}

export async function addTheme(name: string): Promise<number | null> {
  try {
    await query('INSERT INTO categories (name) VALUES (?)', [name]);
    const rows = await query('SELECT id FROM categories WHERE name = ?', [name]);
    return rows[0]?.id || null;
  } catch (error) {
    console.error('Error adding theme:', error);
    return null;
  }
}

export async function addQuestion(q: Question, categoryId: string | number, isCustom: boolean = true) {
  try {
    await query(
      'INSERT INTO questions (category_id, text, options, correctOptionIndex, timeLimit, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
      [categoryId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.timeLimit, isCustom ? 1 : 0]
    );
  } catch (error) {
    console.error('Error adding question:', error);
  }
}

export async function getPendingQuestions(): Promise<SubmittedQuestion[]> {
  try {
    const rows = await query(`
      SELECT sq.*, c.name as theme 
      FROM submit_questions sq
      JOIN categories c ON sq.category_id = c.id
      WHERE sq.status = 'pending'
    `);
    return rows.map((row: any) => ({
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options
    }));
  } catch (error) {
    console.error('Error fetching pending questions:', error);
    return [];
  }
}

export async function addSubmittedQuestion(q: SubmittedQuestion) {
  try {
    const cats = await query('SELECT id FROM categories WHERE name = ?', [q.theme]);
    let catId = cats.length > 0 ? cats[0].id : null;
    if (!catId) {
      catId = await addTheme(q.theme);
    }
    await query(
      'INSERT INTO submit_questions (category_id, text, options, correctOptionIndex, author) VALUES (?, ?, ?, ?, ?)',
      [catId, q.text, JSON.stringify(q.options), q.correctOptionIndex, q.author]
    );
  } catch (error) {
    console.error('Error submitting question:', error);
  }
}

export async function updateSubmittedQuestionStatus(id: string | number, status: 'approved' | 'rejected') {
  try {
    await query('UPDATE submit_questions SET status = ? WHERE id = ?', [status, id]);
    
    if (status === 'approved') {
      const rows = await query('SELECT * FROM submit_questions WHERE id = ?', [id]);
      if (rows.length > 0) {
        const q = rows[0];
        await query(
          'INSERT INTO valid_questions (original_submit_id, category_id, text, options, correctOptionIndex, author) VALUES (?, ?, ?, ?, ?, ?)',
          [q.id, q.category_id, q.text, q.options, q.correctOptionIndex, q.author]
        );
        await query(
          'INSERT INTO questions (category_id, text, options, correctOptionIndex, is_custom) VALUES (?, ?, ?, ?, 1)',
          [q.category_id, q.text, q.options, q.correctOptionIndex]
        );
      }
    }
  } catch (error) {
    console.error('Error updating question status:', error);
  }
}
