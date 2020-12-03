export interface User {
    userName?: string
    token?: string
    authenticated?: boolean
    lastSignIn?: Date
    displayName: string
    email: string
    phoneNumber: string
    photoUrl: string
    permScope: PermMatrix
    _id?: string
    master?: boolean
}

export interface PermMatrix {
    users: PermCRUD
    invent: PermCRUD
    services: PermCRUD
}

export interface PermCRUD {
    create: boolean,
    list: boolean,
    modify: boolean,
    delete: boolean
}

export interface VerificationToken {
    user: User,
    id?: string
}
