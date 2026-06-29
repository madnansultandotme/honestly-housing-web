// API client utility for making requests to backend

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Remove leading /api if present since we add it below
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const url = `${this.baseUrl}/api${cleanEndpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      if (config.body) {
        console.log('📦 Request body:', config.body);
      }

      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

      // Check if response has content
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log(`📊 Content-Type: ${contentType}, Content-Length: ${contentLength}`);

      // Get response text first to see what we're actually receiving
      const responseText = await response.text();
      console.log(`📄 Raw response text (first 500 chars):`, responseText.substring(0, 500));

      // Try to parse as JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log('✅ Successfully parsed JSON response');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('Raw response:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        console.error('❌ Request failed:', data.error || response.statusText);
        throw new Error(data.error || 'Request failed');
      }

      if (data && data.success === true) {
        if (Object.prototype.hasOwnProperty.call(data, 'questionnaire')) return data.questionnaire;
        if (Object.prototype.hasOwnProperty.call(data, 'questionnaireSubmission')) return data.questionnaireSubmission;
        if (Object.prototype.hasOwnProperty.call(data, 'project')) return data.project;
        if (Object.prototype.hasOwnProperty.call(data, 'projects')) return data.projects;
        if (Object.prototype.hasOwnProperty.call(data, 'user')) return data.user;
        if (Object.prototype.hasOwnProperty.call(data, 'categories')) return data.categories;
        if (Object.prototype.hasOwnProperty.call(data, 'selections')) return data.selections;
        if (Object.prototype.hasOwnProperty.call(data, 'options')) return data.options;
        if (Object.prototype.hasOwnProperty.call(data, 'messages')) return data.messages;
        if (Object.prototype.hasOwnProperty.call(data, 'photos')) return data.photos;
        if (Object.prototype.hasOwnProperty.call(data, 'rooms')) return data.rooms;
        if (Object.prototype.hasOwnProperty.call(data, 'templates')) return data.templates;
        if (Object.prototype.hasOwnProperty.call(data, 'notifications')) return data.notifications;
        if (Object.prototype.hasOwnProperty.call(data, 'builderOrg')) return data.builderOrg;
      }

      console.log('✅ Returning data:', data);
      return data;
    } catch (error: any) {
      console.error('❌ API request error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        url,
        method: options.method || 'GET'
      });
      throw error;
    }
  }

  // Auth endpoints
  async signUp(email: string, password: string, displayName?: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyToken(idToken: string) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  // User endpoints
  async getUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'GET',
    });
  }

  async updateUser(userId: string, updates: any) {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Project endpoints
  async getProjects(filters?: {
    clientId?: string;
    builderId?: string;
    status?: string;
  }) {
    const params = new URLSearchParams(filters as any);
    return this.request(`/projects?${params}`, {
      method: 'GET',
    });
  }

  async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'GET',
    });
  }

  async createProject(projectData: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(projectId: string, updates: any) {
    return this.request(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async getMessages(projectId: string) {
    return this.request(`/messages?projectId=${projectId}`, {
      method: 'GET',
    });
  }

  async sendMessage(messageData: {
    projectId: string;
    senderId: string;
    content: string;
    attachments?: string[];
  }) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Photo endpoints
  async getPhotos(projectId: string) {
    return this.request(`/photos?projectId=${projectId}`, {
      method: 'GET',
    });
  }

  async uploadPhoto(photoData: {
    projectId: string;
    url: string;
    caption?: string;
    uploadedBy: string;
  }) {
    return this.request('/photos', {
      method: 'POST',
      body: JSON.stringify(photoData),
    });
  }

  // Generic HTTP methods for flexibility
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
