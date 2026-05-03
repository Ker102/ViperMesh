export const MULTI_VIEW_ROLES = ["front", "left", "back", "right"] as const

export type MultiViewRole = (typeof MULTI_VIEW_ROLES)[number]

export interface MultiViewImageInput {
    role: MultiViewRole
    imageUrl: string
}

export const MULTI_VIEW_INPUT_PREFIX = "multiView."

export const HUNYUAN_MULTI_VIEW_REQUIRED_ROLES = ["front", "left", "back"] as const satisfies readonly MultiViewRole[]

const MULTI_VIEW_ROLE_SET = new Set<string>(MULTI_VIEW_ROLES)

export function getMultiViewInputKey(role: MultiViewRole): string {
    return `${MULTI_VIEW_INPUT_PREFIX}${role}`
}

export function getMultiViewRoleLabel(role: MultiViewRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
}

export function isMultiViewRole(value: unknown): value is MultiViewRole {
    return typeof value === "string" && MULTI_VIEW_ROLE_SET.has(value)
}

export function normalizeMultiViewImages(
    images?: Array<{ role?: unknown; imageUrl?: unknown }> | null,
): MultiViewImageInput[] {
    if (!Array.isArray(images)) return []

    const byRole = new Map<MultiViewRole, string>()
    for (const image of images) {
        if (!isMultiViewRole(image.role) || typeof image.imageUrl !== "string") continue
        const imageUrl = image.imageUrl.trim()
        if (!imageUrl) continue
        byRole.set(image.role, imageUrl)
    }

    return MULTI_VIEW_ROLES
        .map((role) => {
            const imageUrl = byRole.get(role)
            return imageUrl ? { role, imageUrl } : null
        })
        .filter((image): image is MultiViewImageInput => Boolean(image))
}

export function hasRequiredMultiViewRoles(
    images: MultiViewImageInput[],
    requiredRoles: readonly MultiViewRole[],
): boolean {
    const roles = new Set(images.map((image) => image.role))
    return requiredRoles.every((role) => roles.has(role))
}

export function getPrimaryImageFromMultiView(images: MultiViewImageInput[]): string | undefined {
    return images.find((image) => image.role === "front")?.imageUrl ?? images[0]?.imageUrl
}
