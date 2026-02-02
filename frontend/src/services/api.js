// --- api.js ---
// Základní URL směřující na tvůj Django backend (včetně prefixu /api)
const BASE_URL = '/api/';

// --- HELPERS ---
function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([\w-]+)/);
  return match ? match[1] : null;
}

const fetchWithAuth = async (url, options = {}) => {
  const csrfToken = getCsrfToken();

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // pošle cookies
    headers: {
      ...(options.headers || {}),
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Chyba při komunikaci s API');
  }

  if (response.status === 204) return true; // DELETE → 204 No Content

  return await response.json();
};

// ================== UŽIVATEL ==================

// GET: informace o přihlášeném uživateli
export const getMe = async () => {
  return await fetchWithAuth(`${BASE_URL}me/`, { method: 'GET' });
};

// POST: login
export const login = async (username, password) => {
  return await fetchWithAuth(`${BASE_URL}login/`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: registrace
export const register = async (username, password) => {
  return await fetchWithAuth(`${BASE_URL}register/`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: logout
export const logout = async () => {
  return await fetchWithAuth(`${BASE_URL}logout/`, { method: 'POST' });
};

// ================== KURZY ==================

// GET: všechny kurzy
export const getCourses = async () => {
  return await fetchWithAuth(`${BASE_URL}courses/`, { method: 'GET' });
};

// POST: vytvoření kurzu
export const createCourse = async (courseData) => {
  return await fetchWithAuth(`${BASE_URL}courses/`, {
    method: 'POST',
    body: JSON.stringify(courseData),
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT: úprava kurzu
export const updateCourse = async (uuid, courseData) => {
  return await fetchWithAuth(`${BASE_URL}courses/${uuid}/`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE: smazání kurzu
export const deleteCourse = async (uuid) => {
  return await fetchWithAuth(`${BASE_URL}courses/${uuid}/`, { method: 'DELETE' });
};

// GET: detail kurzu
export const getCourseDetail = async (uuid) => {
  return await fetchWithAuth(`${BASE_URL}courses/${uuid}/`, { method: 'GET' });
};

// ================== MATERIÁLY ==================

// GET materiály kurzu
export const getMaterials = async (courseId) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/materials/`, { method: 'GET' });
};

// POST materiál
export const createMaterial = async (courseId, data) => {
  const isFormData = data instanceof FormData;
  if (isFormData) {
    const csrfToken = getCsrfToken();
    return await fetch(`${BASE_URL}courses/${courseId}/materials/`, {
      method: 'POST',
      body: data,
      credentials: 'include',
      headers: csrfToken ? { 'X-CSRFToken': csrfToken } : {},
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Chyba při vytváření materiálu');
      }
      return await res.json();
    });
  } else {
    return await fetchWithAuth(`${BASE_URL}courses/${courseId}/materials/`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT materiál
export const updateMaterial = async (courseId, materialId, data) => {
  const isFormData = data instanceof FormData;
  if (isFormData) {
    const csrfToken = getCsrfToken();
    return await fetch(`${BASE_URL}courses/${courseId}/materials/${materialId}/`, {
      method: 'PUT',
      body: data,
      credentials: 'include',
      headers: csrfToken ? { 'X-CSRFToken': csrfToken } : {},
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Chyba při úpravě materiálu');
      }
      return await res.json();
    });
  } else {
    return await fetchWithAuth(`${BASE_URL}courses/${courseId}/materials/${materialId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE materiál
export const deleteMaterial = async (courseId, materialId) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/materials/${materialId}/`, { method: 'DELETE' });
};

// GET materiál - download
export const downloadMaterialUrl = (courseId, materialId) => {
  return `${BASE_URL}courses/${courseId}/materials/${materialId}/download/`;
};

// ================== KVÍZY ==================

// GET kvízy
export const getQuizzes = async (courseId) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/quizzes/`, { method: 'GET' });
};


// POST kvíz
export const createQuiz = async (courseId, quizData) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/quizzes/`, {
    method: 'POST',
    body: JSON.stringify(quizData),
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT kvíz
export const updateQuiz = async (courseId, quizId, quizData) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/quizzes/${quizId}/`, {
    method: 'PUT',
    body: JSON.stringify(quizData),
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE kvíz
export const deleteQuiz = async (courseId, quizId) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/quizzes/${quizId}/`, { method: 'DELETE' });
};

// POST odeslání odpovědí na kvíz - nefunkční
export const submitQuizAnswers = async (courseId, quizId, answers) => {
  // Získáme CSRF token pro bezpečnost (Django ho vyžaduje u POST i pro anonymní)
  const csrfToken = getCsrfToken();

  const response = await fetch(`${BASE_URL}courses/${courseId}/quizzes/${quizId}/submit/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Pokud máme token, pošleme ho. Pokud ne, nepošleme nic (pro čistě anonymní přístup)
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    },
    body: JSON.stringify({ answers }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Chyba při odesílání odpovědí');
  }

  return await response.json();
};

// GET výsledky kvízu (pro lektora)
export const getQuizResults = async (courseId, quizId) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/quizzes/${quizId}/results/`, { method: 'GET' });
};


// ================== FEED ==================

// GET feed
export const getFeed = async (courseId) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/feed/`, { method: 'GET' });
};

// POST feed item
export const createFeedItem = async (courseId, message) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/feed/`, {
    method: 'POST',
    body: JSON.stringify({ message }),
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT feed item
export const updateFeedItem = async (courseId, itemId, message) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/feed/${itemId}/`, {
    method: 'PUT',
    body: JSON.stringify({ message }),
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE feed item
export const deleteFeedItem = async (courseId, itemId) => {
  return await fetchWithAuth(`${BASE_URL}courses/${courseId}/feed/${itemId}/`, { method: 'DELETE' });
};

// SSE URL pro EventSource
export const getFeedStreamUrl = (courseId) => {
  return `${BASE_URL}courses/${courseId}/feed/stream/`;
};
