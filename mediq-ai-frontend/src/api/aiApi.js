import axios from "axios";

const API_URL = "http://localhost:8080/api/ai";

const getToken = () => {
    return localStorage.getItem("token");
};

const authHeader = () => {
    const token = getToken();

    return {
        Authorization: token
            ? `Bearer ${token}`
            : "",
        "Content-Type": "application/json",
    };
};

export const sendAiMessage = async (
    message,
    conversationId = null
) => {
    const response = await axios.post(
        `${API_URL}/chat`,
        {
            conversationId,
            message,
        },
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getAiConversations = async () => {
    const response = await axios.get(
        `${API_URL}/conversations`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getAiMessages = async (conversationId) => {
    const response = await axios.get(
        `${API_URL}/conversations/${conversationId}/messages`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const deleteAiConversation = async (conversationId) => {
    const response = await axios.delete(
        `${API_URL}/conversations/${conversationId}`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};