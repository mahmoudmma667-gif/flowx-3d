import "server-only";

import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type {
    WorkspaceAttachment,
    WorkspaceModel,
    WorkspaceModelWithAttachments,
    WorkspaceStoreData,
    WorkspaceUser,
} from "@/lib/workspace-types";

const STORE_DIRECTORY = join(process.cwd(), "data");
const STORE_FILE_PATH = join(STORE_DIRECTORY, "workspace.json");
const DEFAULT_USER_ID = "workspace-user";
const DEFAULT_USER_EMAIL = "workspace@flowx.local";
const DEFAULT_USER_NAME = "Flowx Workspace";

let writeQueue: Promise<void> = Promise.resolve();

function createDefaultStore(): WorkspaceStoreData {
    const now = new Date().toISOString();

    return {
        user: {
            id: DEFAULT_USER_ID,
            name: DEFAULT_USER_NAME,
            email: DEFAULT_USER_EMAIL,
            image: null,
            bio: "Local workspace profile for Flowx 3D.",
            role: "OWNER",
            createdAt: now,
            updatedAt: now,
        },
        models: [],
        attachments: [],
    };
}

async function ensureStoreFile() {
    await mkdir(STORE_DIRECTORY, { recursive: true });

    try {
        const rawStore = await readFile(STORE_FILE_PATH, "utf8");

        if (rawStore.trim().length > 0) {
            return;
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }
    }

    await writeFile(STORE_FILE_PATH, JSON.stringify(createDefaultStore(), null, 2), "utf8");
}

async function readWorkspaceStore(): Promise<WorkspaceStoreData> {
    await ensureStoreFile();

    try {
        const rawStore = await readFile(STORE_FILE_PATH, "utf8");
        const parsedStore = JSON.parse(rawStore) as Partial<WorkspaceStoreData>;
        const fallbackStore = createDefaultStore();

        return {
            user: {
                ...fallbackStore.user,
                ...(parsedStore.user ?? {}),
            },
            models: Array.isArray(parsedStore.models) ? parsedStore.models : [],
            attachments: Array.isArray(parsedStore.attachments) ? parsedStore.attachments : [],
        };
    } catch {
        const fallbackStore = createDefaultStore();
        await writeFile(STORE_FILE_PATH, JSON.stringify(fallbackStore, null, 2), "utf8");
        return fallbackStore;
    }
}

async function writeWorkspaceStore(store: WorkspaceStoreData) {
    await mkdir(STORE_DIRECTORY, { recursive: true });
    await writeFile(STORE_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function mutateWorkspaceStore<T>(mutator: (store: WorkspaceStoreData) => Promise<T> | T): Promise<T> {
    const operation = async () => {
        const store = await readWorkspaceStore();
        const result = await mutator(store);
        await writeWorkspaceStore(store);
        return result;
    };

    const task = writeQueue.then(operation, operation);
    writeQueue = task.then(() => undefined, () => undefined);

    return task;
}

function sortByNewest<T extends { createdAt: string }>(items: T[]) {
    return items
        .slice()
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export async function getWorkspaceUser(): Promise<WorkspaceUser> {
    const store = await readWorkspaceStore();
    return store.user;
}

export async function updateWorkspaceUser(input: {
    name?: string | null;
    bio?: string | null;
    image?: string | null;
}): Promise<WorkspaceUser> {
    return mutateWorkspaceStore((store) => {
        store.user = {
            ...store.user,
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.bio !== undefined ? { bio: input.bio } : {}),
            ...(input.image !== undefined ? { image: input.image } : {}),
            updatedAt: new Date().toISOString(),
        };

        return store.user;
    });
}

export async function getWorkspaceModels(): Promise<WorkspaceModel[]> {
    const store = await readWorkspaceStore();
    return sortByNewest(store.models);
}

export async function getWorkspaceModelsByUserId(userId: string): Promise<WorkspaceModel[]> {
    const models = await getWorkspaceModels();
    return models.filter((model) => model.userId === userId);
}

export async function getWorkspaceModelById(id: string): Promise<WorkspaceModelWithAttachments | null> {
    const store = await readWorkspaceStore();
    const model = store.models.find((entry) => entry.id === id);

    if (!model) {
        return null;
    }

    return {
        ...model,
        attachments: sortByNewest(store.attachments.filter((attachment) => attachment.modelId === id)),
    };
}

export async function createWorkspaceModel(input: {
    name: string;
    url: string;
    format: string;
    size: number;
    description?: string | null;
    thumbnail?: string | null;
    vertices?: number | null;
    published?: boolean;
}): Promise<WorkspaceModel> {
    return mutateWorkspaceStore((store) => {
        const now = new Date().toISOString();
        const model: WorkspaceModel = {
            id: randomUUID(),
            name: input.name,
            description: input.description ?? null,
            url: input.url,
            thumbnail: input.thumbnail ?? null,
            format: input.format,
            size: input.size,
            vertices: input.vertices ?? null,
            published: input.published ?? false,
            userId: store.user.id,
            categoryId: null,
            createdAt: now,
            updatedAt: now,
        };

        store.models.unshift(model);
        return model;
    });
}

export async function createWorkspaceAttachment(input: {
    name: string;
    url: string;
    type: string;
    size: number;
    modelId?: string | null;
}): Promise<WorkspaceAttachment> {
    return mutateWorkspaceStore((store) => {
        const now = new Date().toISOString();
        const modelId = input.modelId ?? null;

        if (modelId) {
            const linkedModel = store.models.find((model) => model.id === modelId);

            if (!linkedModel) {
                throw new Error("Model not found for attachment upload");
            }

            linkedModel.updatedAt = now;
        }

        const attachment: WorkspaceAttachment = {
            id: randomUUID(),
            name: input.name,
            url: input.url,
            type: input.type,
            size: input.size,
            modelId,
            userId: store.user.id,
            createdAt: now,
        };

        store.attachments.unshift(attachment);
        return attachment;
    });
}
