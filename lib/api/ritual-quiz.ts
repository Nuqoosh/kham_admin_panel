import { apiRequest } from "./client";
import type {
  RitualQuizOptionInput,
  RitualQuizOptionProductSync,
  RitualQuizQuestionInput,
} from "./types";

export const ritualQuizApi = {
  listQuestions() {
    return apiRequest<unknown[]>("/ritual-quiz/questions");
  },

  createQuestion(payload: RitualQuizQuestionInput) {
    return apiRequest<unknown>("/ritual-quiz/questions", {
      method: "POST",
      body: payload,
    });
  },

  updateQuestion(
    questionId: number | string,
    payload: Partial<RitualQuizQuestionInput>,
  ) {
    return apiRequest<unknown>(`/ritual-quiz/questions/${questionId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  archiveQuestion(questionId: number | string) {
    return apiRequest<unknown>(
      `/ritual-quiz/questions/${questionId}/archive`,
      { method: "POST" },
    );
  },

  createOption(questionId: number | string, payload: RitualQuizOptionInput) {
    return apiRequest<unknown>(`/ritual-quiz/questions/${questionId}/options`, {
      method: "POST",
      body: payload,
    });
  },

  updateOption(
    optionId: number | string,
    payload: Partial<RitualQuizOptionInput>,
  ) {
    return apiRequest<unknown>(`/ritual-quiz/options/${optionId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  archiveOption(optionId: number | string) {
    return apiRequest<unknown>(`/ritual-quiz/options/${optionId}/archive`, {
      method: "POST",
    });
  },

  syncOptionProducts(
    optionId: number | string,
    payload: RitualQuizOptionProductSync,
  ) {
    return apiRequest<unknown>(`/ritual-quiz/options/${optionId}/products`, {
      method: "PUT",
      body: payload,
    });
  },
};
