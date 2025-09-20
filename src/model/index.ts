export type ApiResponse = {
    status?: Status
    data?: any
}

export type Status = {
    code?: number
    message?: string
}