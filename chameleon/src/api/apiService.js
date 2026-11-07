import axiosInstance from './axios';

/**
 * Modular Enterprise API Service Layer
 * Domain namespaces organized in PascalCase with semantic camelCase methods.
 */

// ── Cerberus Domain (Identity, Authentication, Teams) ──
export const CerberusAuthApi = {
  loginUser: async (credentials) => {
    const response = await axiosInstance.post('user/token/', credentials);
    return response.data;
  },

  registerUser: async (registrationData) => {
    const response = await axiosInstance.post('user/register/', registrationData);
    return response.data;
  },

  refreshToken: async (refresh) => {
    const response = await axiosInstance.post('user/token/refresh/', { refresh });
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await axiosInstance.post('user/auth/password/reset/', { email });
    return response.data;
  },

  verifyPasswordResetOtp: async ({ email, otp, newPassword }) => {
    const response = await axiosInstance.post('user/auth/password/reset/verify/', {
      email,
      otp,
      new_password: newPassword,
    });
    return response.data;
  },

  googleLogin: async (accessToken) => {
    const response = await axiosInstance.post('user/auth/google/', { access_token: accessToken });
    return response.data;
  },

  pingHealth: async () => {
    const response = await axiosInstance.get('user/ping/');
    return response.data;
  },
};

export const CerberusTeamApi = {
  fetchTeams: async () => {
    const response = await axiosInstance.get('teams/');
    return response.data;
  },

  createTeam: async (payload) => {
    const response = await axiosInstance.post('teams/', payload);
    return response.data;
  },

  fetchTeamMessages: async (teamId) => {
    const response = await axiosInstance.get(`teams/messages/?team_id=${teamId}`);
    return response.data;
  },

  sendTeamMessage: async (payload) => {
    const response = await axiosInstance.post('teams/messages/', payload);
    return response.data;
  },
};

// ── Golem Domain (PII Analysis & Wordlist Synthesis Engine) ──
export const GolemEngineApi = {
  submitPiiAssessment: async (piiPayload) => {
    const response = await axiosInstance.post('submit/', piiPayload);
    return response.data;
  },

  fetchGenerationHistory: async () => {
    const response = await axiosInstance.get('history/');
    return response.data;
  },

  deleteHistoryRecord: async (id) => {
    const response = await axiosInstance.delete(`history/${id}/`);
    return response.data;
  },

  downloadWordlistUrl: (id) => `${axiosInstance.defaults.baseURL}download/${id}/`,

  exportHistoryCsv: async () => {
    const response = await axiosInstance.get('export/csv/', { responseType: 'blob' });
    return response.data;
  },

  downloadReportPdf: async (id) => {
    const response = await axiosInstance.get(`report/pdf/${id}/`, { responseType: 'blob' });
    return response.data;
  },

  fetchUserProfile: async () => {
    const response = await axiosInstance.get('profile/');
    return response.data;
  },

  fetchUserStats: async () => {
    const response = await axiosInstance.get('stats/');
    return response.data;
  },

  generateDownloadToken: async (fileType, id) => {
    const response = await axiosInstance.post('downloadToken/', { file_type: fileType, id });
    return response.data;
  },

  fetchCachedWordlist: async (cacheKey) => {
    const response = await axiosInstance.get(`cached/${cacheKey}/`);
    return response.data;
  },
};

// ── Valkyrie Domain (Password & Breach Security Intelligence) ──
export const ValkyrieSecurityApi = {
  evaluatePasswordScore: async (password, piiData = {}) => {
    const response = await axiosInstance.post('password/score/', { password, pii_data: piiData });
    return response.data;
  },

  searchBreaches: async (query) => {
    const response = await axiosInstance.post('password/breachSearch/', { query });
    return response.data;
  },

  fetchUserPreferences: async () => {
    const response = await axiosInstance.get('password/preference/');
    return response.data;
  },

  updateUserPreferences: async (preferences) => {
    const response = await axiosInstance.put('password/preference/', preferences);
    return response.data;
  },

  fetchAuditLogs: async () => {
    const response = await axiosInstance.get('password/audit/');
    return response.data;
  },
};

// ── Argus Domain (Operations, Telemetry & Logs) ──
export const ArgusOperationsApi = {
  fetchSystemLogs: async () => {
    const response = await axiosInstance.get('operations/logs/');
    return response.data;
  },

  fetchGlobeTelemetry: async () => {
    const response = await axiosInstance.get('operations/analyticsGlobe/');
    return response.data;
  },

  fetchNotifications: async () => {
    const response = await axiosInstance.get('operations/notifications/');
    return response.data;
  },

  markNotificationsRead: async (payload = { action: 'mark_all_read' }) => {
    const response = await axiosInstance.post('operations/notifications/', payload);
    return response.data;
  },

  fetchMessages: async () => {
    const response = await axiosInstance.get('operations/messages/');
    return response.data;
  },

  sendMessage: async (payload) => {
    const response = await axiosInstance.post('operations/messages/', payload);
    return response.data;
  },

  fetchSystemSettings: async () => {
    const response = await axiosInstance.get('operations/settings/');
    return response.data;
  },

  updateSystemSettings: async (settings) => {
    const response = await axiosInstance.post('operations/settings/', settings);
    return response.data;
  },

  executeTerminalCommand: async (command) => {
    const response = await axiosInstance.post('operations/terminal/', { command });
    return response.data;
  },

  fetchAdminUsers: async () => {
    const response = await axiosInstance.get('operations/adminUsers/');
    return response.data;
  },

  purgeAllTelemetry: async () => {
    const response = await axiosInstance.delete('operations/adminPurgeAll/');
    return response.data;
  },

  fetchHealthStatus: async () => {
    const response = await axiosInstance.get('health/');
    return response.data;
  },
};

export default {
  CerberusAuth: CerberusAuthApi,
  CerberusTeam: CerberusTeamApi,
  GolemEngine: GolemEngineApi,
  ValkyrieSecurity: ValkyrieSecurityApi,
  ArgusOperations: ArgusOperationsApi,
};

