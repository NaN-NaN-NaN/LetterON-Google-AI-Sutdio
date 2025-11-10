import { User, Letter, ChatMessage, LetterCategory, ActionStatus } from '../types';

// --- Mock Database (using localStorage) ---

const DB = {
  users: 'letteron_users',
  letters: 'letteron_letters',
  chats: 'letteron_chats',
};

const initializeDB = () => {
  if (!localStorage.getItem(DB.users)) {
    localStorage.setItem(DB.users, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB.letters)) {
    localStorage.setItem(DB.letters, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB.chats)) {
    localStorage.setItem(DB.chats, JSON.stringify([]));
  }
};

initializeDB();

// --- Helper Functions ---

const read = <T,>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const write = <T,>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));
const uuid = () => crypto.randomUUID();
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Sample Data
const addSampleData = (userId: string) => {
    let letters = read<Letter>(DB.letters);
    if (letters.filter(l => l.user_id === userId).length === 0) {
        const sampleLetters: Omit<Letter, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
            {
                title: "Electricity Bill - October",
                content: "Your electricity bill for October is due. Amount: 120 EUR. Due date: 2025-11-15.",
                category: LetterCategory.UTILITY,
                sender_info: { name: "City Power", address: "123 Power St", phone: "555-0101", email: "contact@citypower.com" },
                starred: true,
                reminder_active: true,
                ai_summary: "This is the monthly electricity bill amounting to 120 EUR, due on November 15, 2025.",
                ai_suggestion: "Pay 120 EUR before November 15, 2025.",
                ai_suggestion_action_deadline_date: "2025-11-15",
                action_status: ActionStatus.WAIT_FOR_ACTION,
                sent_at: "2025-10-20T10:00:00Z",
                deleted_at: null,
                images: ["https://picsum.photos/400/550"],
                note: "Paid this late last time, be careful.",
                reminder_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                translations: {},
            },
            {
                title: "Tax Return Confirmation",
                content: "We have received your tax return for the year 2024. No further action is required.",
                category: LetterCategory.TAX,
                sender_info: { name: "National Tax Office", address: "1 Government Plaza", phone: "555-0102", email: "info@taxoffice.gov" },
                starred: false,
                reminder_active: false,
                ai_summary: "Confirmation that the 2024 tax return has been successfully filed. No action is needed.",
                ai_suggestion: "File this document for your records.",
                ai_suggestion_action_deadline_date: null,
                action_status: ActionStatus.COMPLETE,
                sent_at: "2025-09-05T10:00:00Z",
                deleted_at: null,
                images: ["https://picsum.photos/400/550?grayscale"],
                reminder_at: null,
                translations: {},
            },
                   {
                title: "Payment requirement",
                content: `Dear [Client Name],

We hope this letter finds you well.

We are writing to remind you of the outstanding payment due under your account [Account Number or Contract Reference] with [Bank Name]. As of the date of this letter, the total amount of [Amount in EUR/USD/etc.] remains unpaid.

To ensure timely processing and avoid any service interruptions or additional charges, please arrange payment no later than [Deadline Date] using the following bank details:

Beneficiary: [Bank Name or Department]
IBAN: [Your IBAN here]
BIC / SWIFT Code: [Your SWIFT code]
Payment Reference: [Reference Number or Customer ID]
Amount Due: [Amount + Currency]

Please note that timely payment will help us continue providing uninterrupted services and maintain your account in good standing. If you have already settled this amount, kindly disregard this notice. Otherwise, we would appreciate your immediate attention to this matter.

Should you have any questions or require assistance with your payment, please do not hesitate to contact our customer service team at [Contact Email / Phone Number].

Thank you for your prompt cooperation.

Yours sincerely,
[Your Name]
[Your Position]
[Bank Name]
[Contact Information]`,
                category: LetterCategory.BANK,
                sender_info: { name: "National Bank", address: "1 Government Plaza", phone: "555-0102", email: "info@taxoffice.gov" },
                starred: false,
                reminder_active: false,
                ai_summary: "Confirmation that the 2024 tax return has been successfully filed. No action is needed.",
                ai_suggestion: "File this document for your records.",
                ai_suggestion_action_deadline_date: null,
                action_status: ActionStatus.WAIT_FOR_ACTION,
                sent_at: "2025-09-05T10:00:00Z",
                deleted_at: null,
                images: ["https://picsum.photos/400/550?grayscale"],
                reminder_at: null,
                translations: {},
            },
        ];
        
        const now = new Date();
        const newLetters = sampleLetters.map((l, index) => ({
            ...l,
            id: uuid(),
            user_id: userId,
            created_at: new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)).toISOString(),
            updated_at: new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)).toISOString(),
        }));

        write(DB.letters, [...letters, ...newLetters]);
    }
};


// --- Auth API ---

export const mockRegister = async (email: string, pass: string, name: string): Promise<User> => {
  await delay(500);
  const users = read<User>(DB.users);
  if (users.some(u => u.email === email)) {
    throw new Error('User with this email already exists.');
  }
  const newUser: User = {
    id: uuid(),
    email,
    display_name: name,
    role: 'user',
    created_at: new Date().toISOString(),
  };
  write(DB.users, [...users, newUser]);
  addSampleData(newUser.id); // Add sample data for new user
  return newUser;
};

export const mockLogin = async (email: string, pass: string): Promise<User> => {
  await delay(500);
  const users = read<User>(DB.users);
  const user = users.find(u => u.email === email);
  // NOTE: Password is not checked in this mock
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  return user;
};

export const mockLogout = () => {
    // In a real app, this would invalidate a token on the server.
    // For the mock, we just clear the frontend state.
    console.log("User logged out.");
};

// --- Letters API ---

const getCurrentUserId = (): string => {
    const userStr = localStorage.getItem('letteron_user');
    if (!userStr) throw new Error("Not authenticated");
    return (JSON.parse(userStr) as User).id;
}

export const getLetters = async (): Promise<Letter[]> => {
    await delay(500);
    const userId = getCurrentUserId();
    const letters = read<Letter>(DB.letters);
    return letters.filter(l => l.user_id === userId && !l.deleted_at);
};

export const getLetterById = async (id: string): Promise<Letter> => {
    await delay(300);
    const userId = getCurrentUserId();
    const letters = read<Letter>(DB.letters);
    const letter = letters.find(l => l.id === id && l.user_id === userId);
    if (!letter) {
        throw new Error('Letter not found.');
    }
    return letter;
};

export const createLetter = async (data: Partial<Letter>): Promise<Letter> => {
    await delay(500);
    const userId = getCurrentUserId();
    const newLetter: Letter = {
        id: uuid(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: data.title || 'Untitled Letter',
        content: data.content || '',
        category: data.category || LetterCategory.GENERAL,
        sender_info: data.sender_info || { name: 'Unknown', address: '', phone: '', email: ''},
        starred: data.starred || false,
        reminder_active: data.reminder_active || false,
        ai_summary: data.ai_summary || '',
        ai_suggestion: data.ai_suggestion || '',
        ai_suggestion_action_deadline_date: data.ai_suggestion_action_deadline_date || null,
        action_status: data.action_status || ActionStatus.NONE,
        sent_at: data.sent_at || new Date().toISOString(),
        deleted_at: null,
        images: data.images || [],
        reminder_at: null,
        translations: {},
    };
    const letters = read<Letter>(DB.letters);
    write(DB.letters, [...letters, newLetter]);
    return newLetter;
};

export const updateLetter = async (id: string, data: Partial<Letter>): Promise<Letter> => {
    await delay(200);
    const userId = getCurrentUserId();
    let letters = read<Letter>(DB.letters);
    const index = letters.findIndex(l => l.id === id && l.user_id === userId);
    if (index === -1) {
        throw new Error('Letter not found.');
    }
    letters[index] = { ...letters[index], ...data, updated_at: new Date().toISOString() };
    write(DB.letters, letters);
    return letters[index];
};

export const deleteLetter = async (id: string): Promise<void> => {
    await delay(300);
    const userId = getCurrentUserId();
    let letters = read<Letter>(DB.letters);
    const index = letters.findIndex(l => l.id === id && l.user_id === userId);
     if (index === -1) {
        throw new Error('Letter not found.');
    }
    // Soft delete
    letters[index].deleted_at = new Date().toISOString();
    write(DB.letters, letters);
};


// --- Chat API ---

export const getChatHistory = async (letterId: string): Promise<ChatMessage[]> => {
    await delay(200);
    const userId = getCurrentUserId();
    const chats = read<ChatMessage>(DB.chats);
    return chats.filter(m => m.letter_id === letterId && m.user_id === userId);
};

export const addChatMessage = async (letterId: string, message: string, role: 'user' | 'assistant' = 'user'): Promise<ChatMessage> => {
    await delay(100);
    const userId = getCurrentUserId();
    const newMessage: ChatMessage = {
        id: uuid(),
        letter_id: letterId,
        user_id: userId,
        role,
        message,
        created_at: new Date().toISOString(),
        deleted_at: null,
    };
    const chats = read<ChatMessage>(DB.chats);
    write(DB.chats, [...chats, newMessage]);
    return newMessage;
};
