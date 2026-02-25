import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OfflineQuestion {
  id: string;
  category: string;
  question_text: string;
  timestamp: number;
}

const DB_NAME = 'fatwa-offline-db';
const STORE_NAME = 'pending-questions';
const DB_VERSION = 1;

// ظپطھط­ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// ط­ظپط¸ ط³ط¤ط§ظ„
const saveQuestionToDB = async (question: OfflineQuestion): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(question);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// ط¬ظ„ط¨ ط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط­ظپظˆط¸ط©
const getAllQuestions = async (): Promise<OfflineQuestion[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// طھط­ط¯ظٹط« ط³ط¤ط§ظ„
const updateQuestionInDB = async (id: string, data: Partial<OfflineQuestion>): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (existing) {
        const updated = { ...existing, ...data };
        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      } else {
        reject(new Error('Question not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// ط­ط°ظپ ط³ط¤ط§ظ„
const deleteQuestionFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط¦ظ„ط©
const deleteAllQuestionsFromDB = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export function useOfflineQuestions() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineQuestions, setOfflineQuestions] = useState<OfflineQuestion[]>([]);
  const { toast } = useToast();

  // طھط­ط¯ظٹط« ط¹ط¯ط¯ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط¹ظ„ظ‚ط© ظˆظ‚ط§ط¦ظ…طھظ‡ط§
  const updatePendingCount = useCallback(async () => {
    try {
      const questions = await getAllQuestions();
      setPendingCount(questions.length);
      setOfflineQuestions(questions);
    } catch (error) {
      console.error('Error getting pending questions:', error);
    }
  }, []);

  // ط¬ظ„ط¨ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط­ظپظˆط¸ط©
  const getOfflineQuestions = useCallback(async (): Promise<OfflineQuestion[]> => {
    try {
      const questions = await getAllQuestions();
      setOfflineQuestions(questions);
      return questions;
    } catch (error) {
      console.error('Error getting offline questions:', error);
      return [];
    }
  }, []);

  // طھط­ط¯ظٹط« ط³ط¤ط§ظ„ ظ…ط­ظپظˆط¸
  const updateQuestion = useCallback(async (id: string, data: Partial<OfflineQuestion>) => {
    try {
      await updateQuestionInDB(id, data);
      await updatePendingCount();
      toast({
        title: 'âœ“',
        description: 'طھظ… طھط­ط¯ظٹط« ط§ظ„ط³ط¤ط§ظ„',
      });
    } catch (error) {
      console.error('Error updating question:', error);
    }
  }, [toast, updatePendingCount]);

  // ط­ط°ظپ ط³ط¤ط§ظ„ ظ…ط­ظپظˆط¸
  const deleteQuestion = useCallback(async (id: string) => {
    try {
      await deleteQuestionFromDB(id);
      await updatePendingCount();
      toast({
        title: 'ًں—‘ï¸ڈ',
        description: 'طھظ… ط­ط°ظپ ط§ظ„ط³ط¤ط§ظ„',
      });
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  }, [toast, updatePendingCount]);

  // ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط­ظپظˆط¸ط©
  const clearAllQuestions = useCallback(async () => {
    try {
      await deleteAllQuestionsFromDB();
      await updatePendingCount();
      toast({
        title: 'ًں—‘ï¸ڈ طھظ… ط§ظ„ظ…ط³ط­',
        description: 'طھظ… ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط­ظپظˆط¸ط© ظ…ط­ظ„ظٹط§ظ‹',
      });
    } catch (error) {
      console.error('Error clearing all questions:', error);
    }
  }, [toast, updatePendingCount]);

  // ظ…ط²ط§ظ…ظ†ط© ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط¹ظ„ظ‚ط©
  const syncPendingQuestions = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const questions = await getAllQuestions();

      if (questions.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;

      for (const q of questions) {
        try {
          const { data, error } = await supabase
            .from('questions')
            .insert({
              category: q.category,
              question_text: q.question_text,
            })
            .select('id')
            .single();

          if (!error) {
            await deleteQuestionFromDB(q.id);
            successCount++;
            try {
              await supabase.functions.invoke('send-notification', {
                body: {
                  action: 'notify-new-question',
                  question_id: data?.id,
                }
              });
            } catch (notifyError) {
              console.warn('Failed to send new question notification:', notifyError);
            }
          }
        } catch (err) {
          console.error('Error syncing question:', err);
        }
      }

      if (successCount > 0) {
        toast({
          title: 'âœ… طھظ…طھ ط§ظ„ظ…ط²ط§ظ…ظ†ط©',
          description: `طھظ… ط¥ط±ط³ط§ظ„ ${successCount} ط³ط¤ط§ظ„ ظ…ط­ظپظˆط¸`,
        });
      }

      await updatePendingCount();
    } catch (error) {
      console.error('Error syncing questions:', error);
    }
    setIsSyncing(false);
  }, [isSyncing, toast, updatePendingCount]);

  // ط­ظپط¸ ط³ط¤ط§ظ„ ظ„ظ„ط¥ط±ط³ط§ظ„ ظ„ط§ط­ظ‚ط§ظ‹
  const saveForLater = useCallback(async (category: string, question_text: string) => {
    const question: OfflineQuestion = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      question_text,
      timestamp: Date.now(),
    };

    await saveQuestionToDB(question);
    await updatePendingCount();

    toast({
      title: 'ًں’¾ طھظ… ط§ظ„ط­ظپط¸',
      description: 'ط³ظٹظڈط±ط³ظ„ ط§ظ„ط³ط¤ط§ظ„ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ط¹ظ†ط¯ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط¥ظ†طھط±ظ†طھ',
    });
  }, [toast, updatePendingCount]);

  // ظ…ط±ط§ظ‚ط¨ط© ط­ط§ظ„ط© ط§ظ„ط§طھطµط§ظ„
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'ًںŒگ ظ…طھطµظ„ ط¨ط§ظ„ط¥ظ†طھط±ظ†طھ',
        description: 'ط¬ط§ط±ظچ ظ…ط²ط§ظ…ظ†ط© ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط­ظپظˆط¸ط©...',
      });
      syncPendingQuestions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'ًں“´ ط؛ظٹط± ظ…طھطµظ„',
        description: 'ط³ظٹطھظ… ط­ظپط¸ ط£ط³ط¦ظ„طھظƒ ظˆط¥ط±ط³ط§ظ„ظ‡ط§ ط¹ظ†ط¯ ط§ظ„ط§طھطµط§ظ„',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // طھط­ط¯ظٹط« ط§ظ„ط¹ط¯ط¯ ط¹ظ†ط¯ ط§ظ„طھط­ظ…ظٹظ„
    updatePendingCount();

    // ظ…ط­ط§ظˆظ„ط© ط§ظ„ظ…ط²ط§ظ…ظ†ط© ط¹ظ†ط¯ ط§ظ„طھط­ظ…ظٹظ„
    if (navigator.onLine) {
      syncPendingQuestions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingQuestions, toast, updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    offlineQuestions,
    saveForLater,
    syncPendingQuestions,
    getOfflineQuestions,
    updateQuestion,
    deleteQuestion,
    clearAllQuestions,
  };
}
