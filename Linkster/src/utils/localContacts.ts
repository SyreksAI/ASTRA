import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalContact = {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  createdAt: string;
};

const STORAGE_KEY = 'talk_local_contacts_v1';

export function localContactDisplayName(c: LocalContact): string {
  const last = c.lastName?.trim();
  return last ? `${c.firstName.trim()} ${last}` : c.firstName.trim();
}

export async function loadLocalContacts(): Promise<LocalContact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalContact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addLocalContact(input: {
  firstName: string;
  lastName?: string;
  phone: string;
}): Promise<LocalContact> {
  const firstName = input.firstName.trim();
  const phone = input.phone.trim();
  if (!firstName) throw new Error('Укажите имя');
  if (!phone) throw new Error('Укажите номер телефона');

  const contact: LocalContact = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    firstName,
    lastName: input.lastName?.trim() || undefined,
    phone,
    createdAt: new Date().toISOString(),
  };

  const list = await loadLocalContacts();
  list.unshift(contact);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return contact;
}
