import { NextResponse } from "next/server";

type ApiResponseOptions = {
    status?: number;
};

export function successResponse(data: unknown, options?: ApiResponseOptions) {
    return NextResponse.json({ success: true, data }, { status: options?.status || 200 });
}

export function errorResponse(message: string, options?: ApiResponseOptions) {
    return NextResponse.json(
        { success: false, error: message },
        { status: options?.status || 400 }
    );
}

export function handleApiError(error: unknown) {
    console.error("API Error:", error);

    if (error instanceof Error && error.message.includes("Validation")) {
        return errorResponse("Validation error", { status: 400 });
    }

    return errorResponse("Internal Server Error", { status: 500 });
}
