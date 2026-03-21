import { createHash } from "node:crypto";
import type { User } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { getPrismaClient } from "@/lib/server/db";

const USERS_FILE = "users.json";

interface StoredUser extends User {
  passwordHash: string;
}

function resolveRoleForEmail(email: string): "CUSTOMER" | "ADMIN" {
  const normalized = normalizeEmail(email);
  const configuredAdmin = normalizeEmail(process.env.ADMIN_EMAIL ?? "admin@babyonline.hu");
  return normalized === configuredAdmin ? "ADMIN" : "CUSTOMER";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function getConfiguredAdminEmail(): string {
  return normalizeEmail(process.env.ADMIN_EMAIL ?? "admin@babyonline.hu");
}

function getBootstrapAdminPassword(): string {
  return String(process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "").trim();
}

async function ensureAdminUserForBootstrap(
  users: StoredUser[],
  email: string,
  password: string
): Promise<StoredUser[]> {
  const adminEmail = getConfiguredAdminEmail();
  const bootstrapPassword = getBootstrapAdminPassword();
  if (!bootstrapPassword) return users;
  if (email !== adminEmail) return users;
  if (password !== bootstrapPassword) return users;

  const now = new Date().toISOString();
  const existingIndex = users.findIndex((entry) => normalizeEmail(entry.email) === email);
  if (existingIndex < 0) {
    users.unshift({
      id: `user-${Date.now()}`,
      email,
      name: "Admin",
      phone: undefined,
      role: "ADMIN",
      addresses: [],
      wishlist: [],
      createdAt: now,
      passwordHash: hashPassword(password),
    });
    await saveStoredUsers(users);
    return users;
  }

  const existing = users[existingIndex];
  const nextHash = hashPassword(password);
  const roleChanged = existing.role !== "ADMIN";
  const passwordChanged = existing.passwordHash !== nextHash;
  if (roleChanged || passwordChanged) {
    users[existingIndex] = {
      ...existing,
      role: "ADMIN",
      passwordHash: nextHash,
    };
    await saveStoredUsers(users);
  }
  return users;
}

async function getStoredUsers(): Promise<StoredUser[]> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const dbUsers = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      if (dbUsers.length === 0) {
        const fileUsers = await readJsonFile<StoredUser[]>(USERS_FILE, []);
        if (fileUsers.length > 0) {
          await saveStoredUsers(fileUsers);
          return fileUsers;
        }
      }
      return dbUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        phone: user.phone ?? undefined,
        role: user.role,
        addresses: (user.addresses as unknown as User["addresses"]) ?? [],
        wishlist: user.wishlist ?? [],
        createdAt: user.createdAt.toISOString(),
        passwordHash: user.passwordHash,
      }));
    } catch (error) {
      console.error("Prisma getStoredUsers fallback to JSON:", error);
    }
  }
  return readJsonFile<StoredUser[]>(USERS_FILE, []);
}

async function saveStoredUsers(users: StoredUser[]): Promise<void> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      for (const user of users) {
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role ?? "CUSTOMER",
            addresses: user.addresses as any,
            wishlist: user.wishlist,
            createdAt: new Date(user.createdAt),
            passwordHash: user.passwordHash,
          },
          update: {
            name: user.name,
            phone: user.phone,
            role: user.role ?? "CUSTOMER",
            addresses: user.addresses as any,
            wishlist: user.wishlist,
            passwordHash: user.passwordHash,
          },
        });
      }
      return;
    } catch (error) {
      console.error("Prisma saveStoredUsers fallback to JSON:", error);
    }
  }
  await writeJsonFile(USERS_FILE, users);
}

function toPublicUser(user: StoredUser): User {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  void _passwordHash;
  return publicUser;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const email = normalizeEmail(input.email);
  const users = await getStoredUsers();

  const exists = users.some((entry) => normalizeEmail(entry.email) === email);
  if (exists) {
    throw new Error("Ezzel az email címmel már létezik fiók.");
  }

  const now = new Date().toISOString();
  const user: StoredUser = {
    id: `user-${Date.now()}`,
    email,
    name: input.name.trim(),
    addresses: [],
    wishlist: [],
    createdAt: now,
    role: resolveRoleForEmail(email),
    passwordHash: hashPassword(input.password),
  };

  users.unshift(user);
  await saveStoredUsers(users);
  return toPublicUser(user);
}

export async function getUsers(): Promise<User[]> {
  const users = await getStoredUsers();
  return users.map(toPublicUser);
}

export async function getUserByEmail(emailInput: string): Promise<User | null> {
  const email = normalizeEmail(emailInput);
  const users = await getStoredUsers();
  const found = users.find((entry) => normalizeEmail(entry.email) === email);
  return found ? toPublicUser(found) : null;
}

export async function updateUserProfile(
  emailInput: string,
  input: { name?: string; phone?: string }
): Promise<User> {
  const email = normalizeEmail(emailInput);
  const users = await getStoredUsers();
  const index = users.findIndex((entry) => normalizeEmail(entry.email) === email);
  if (index < 0) {
    throw new Error("Felhasználó nem található.");
  }
  const existing = users[index];
  users[index] = {
    ...existing,
    name: input.name?.trim() || existing.name,
    phone: input.phone?.trim() || undefined,
  };
  await saveStoredUsers(users);
  return toPublicUser(users[index]);
}

export async function updateUserAddresses(
  emailInput: string,
  addresses: User["addresses"]
): Promise<User> {
  const email = normalizeEmail(emailInput);
  const users = await getStoredUsers();
  const index = users.findIndex((entry) => normalizeEmail(entry.email) === email);
  if (index < 0) {
    throw new Error("Felhasználó nem található.");
  }
  users[index] = {
    ...users[index],
    addresses: Array.isArray(addresses) ? addresses : [],
  };
  await saveStoredUsers(users);
  return toPublicUser(users[index]);
}

export async function updateUserWishlist(
  emailInput: string,
  wishlist: string[]
): Promise<User> {
  const email = normalizeEmail(emailInput);
  const users = await getStoredUsers();
  const index = users.findIndex((entry) => normalizeEmail(entry.email) === email);
  if (index < 0) {
    throw new Error("Felhasználó nem található.");
  }
  users[index] = {
    ...users[index],
    wishlist: Array.isArray(wishlist) ? wishlist : [],
  };
  await saveStoredUsers(users);
  return toPublicUser(users[index]);
}

export async function deleteUserByEmail(emailInput: string): Promise<void> {
  const email = normalizeEmail(emailInput);
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.user.delete({ where: { email } });
      return;
    } catch (error) {
      console.error("Prisma deleteUserByEmail fallback to JSON:", error);
    }
  }

  const users = await getStoredUsers();
  const next = users.filter((entry) => normalizeEmail(entry.email) !== email);
  await saveStoredUsers(next);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<User> {
  const email = normalizeEmail(input.email);
  const users = await ensureAdminUserForBootstrap(
    await getStoredUsers(),
    email,
    String(input.password)
  );
  const user = users.find((entry) => normalizeEmail(entry.email) === email);

  if (!user) {
    throw new Error("Hibás email cím vagy jelszó.");
  }

  if (user.passwordHash !== hashPassword(input.password)) {
    throw new Error("Hibás email cím vagy jelszó.");
  }

  const expectedRole = resolveRoleForEmail(user.email);
  if (user.role !== expectedRole) {
    user.role = expectedRole;
    await saveStoredUsers(users);
  }

  return toPublicUser(user);
}
