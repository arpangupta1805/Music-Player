// Dashboard JavaScript

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const sidebarItems = document.querySelectorAll('.sidebar-item');
const dashboardSections = document.querySelectorAll('.dashboard-section');
const profileNameElement = document.getElementById('profile-name');
const profileEmailElement = document.getElementById('profile-email');
const profileImageElement = document.getElementById('profile-image');
const profileForm = document.getElementById('profile-edit-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');
const userNameElement = document.getElementById('user-name');
const createPlaylistBtn = document.getElementById('create-playlist-btn');
const createPlaylistModal = document.getElementById('create-playlist-modal');
const closeModalBtn = document.querySelector('.close-modal');
const createPlaylistForm = document.getElementById('create-playlist-form');
const favoriteSongsList = document.getElementById('favorite-songs-list');
const favoriteAlbumsGrid = document.getElementById('favorite-albums-grid');
const recentSongsList = document.getElementById('recent-songs-list');
const playlistsGrid = document.getElementById('playlists-grid');
const themeIcon = document.getElementById('theme-icon');

// API URL
const API_URL = 'http://localhost:5002/api';

// User data
let userData = null;

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    return token;
}

// Fetch user profile
async function fetchUserProfile() {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        userData = await response.json();
        updateProfileUI(userData);
        loadFavorites(userData);
        loadRecentlyPlayed(userData);
        loadPlaylists();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showToast('Error loading profile data', 'error');
    } finally {
        hideLoading();
    }
}

// Update profile UI
function updateProfileUI(user) {
    profileNameElement.textContent = user.name;
    profileEmailElement.textContent = user.email;
    userNameElement.textContent = user.name;
    
    if (user.profilePicture && !user.profilePicture.includes('default-profile')) {
        profileImageElement.src = user.profilePicture;
    }
    
    nameInput.value = user.name;
    emailInput.value = user.email;
    
    // Hide password field for Google users
    if (user.isGoogleUser) {
        document.querySelector('.password-group').style.display = 'none';
    }
}

// Load favorites
function loadFavorites(user) {
    // Load favorite songs
    if (user.favorites && user.favorites.songs && user.favorites.songs.length > 0) {
        favoriteSongsList.innerHTML = '';
        fetchFavoriteSongs(user.favorites.songs);
    }
    
    // Load favorite albums
    if (user.favorites && user.favorites.albums && user.favorites.albums.length > 0) {
        favoriteAlbumsGrid.innerHTML = '';
        fetchFavoriteAlbums(user.favorites.albums);
    }
}

// Fetch favorite songs
async function fetchFavoriteSongs(songIds) {
    const token = checkAuth();
    try {
        const songPromises = songIds.map(id => 
            fetch(`${API_URL}/songs/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => res.json())
        );
        
        const songs = await Promise.all(songPromises);
        renderSongs(songs, favoriteSongsList);
    } catch (error) {
        console.error('Error fetching favorite songs:', error);
        showToast('Error loading favorite songs', 'error');
    }
}

// Fetch favorite albums
async function fetchFavoriteAlbums(albumIds) {
    const token = checkAuth();
    try {
        const albumPromises = albumIds.map(id => 
            fetch(`${API_URL}/albums/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => res.json())
        );
        
        const albums = await Promise.all(albumPromises);
        renderAlbums(albums, favoriteAlbumsGrid);
    } catch (error) {
        console.error('Error fetching favorite albums:', error);
        showToast('Error loading favorite albums', 'error');
    }
}

// Load recently played
function loadRecentlyPlayed(user) {
    console.log(user);
    console.log(user.recentlyPlayed);
    if (user.recentlyPlayed && user.recentlyPlayed.length > 0) {
        recentSongsList.innerHTML = '';
        const recentSongIds = user.recentlyPlayed.map(item => item.song);
        fetchRecentSongs(recentSongIds);
    }
}

// Fetch recently played songs
async function fetchRecentSongs(songIds) {
    const token = checkAuth();
    try {
        const songPromises = songIds.map(id => 
            fetch(`${API_URL}/songs/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => res.json())
        );
        
        const songs = await Promise.all(songPromises);
        renderSongs(songs, recentSongsList);
    } catch (error) {
        console.error('Error fetching recent songs:', error);
        showToast('Error loading recently played songs', 'error');
    }
}

// Load playlists
async function loadPlaylists() {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_URL}/playlists`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch playlists');
        }

        const playlists = await response.json();
        renderPlaylists(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        showToast('Error loading playlists', 'error');
    }
}

// Render songs
function renderSongs(songs, container) {
    if (songs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">music_note</span>
                <p>No songs found</p>
            </div>
        `;
        return;
    }

    songs.forEach(song => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <div class="song-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>
            <div class="song-actions">
                <button class="play-btn" data-id="${song._id}">
                    <span class="material-symbols-outlined">play_arrow</span>
                </button>
                <button class="remove-favorite-btn" data-id="${song._id}">
                    <span class="material-symbols-outlined">favorite</span>
                </button>
            </div>
        `;
        container.appendChild(songElement);
    });

    // Add event listeners
    container.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const songId = btn.getAttribute('data-id');
            playSong(songId);
        });
    });

    container.querySelectorAll('.remove-favorite-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const songId = btn.getAttribute('data-id');
            removeSongFromFavorites(songId);
        });
    });
}

// Render albums
function renderAlbums(albums, container) {
    if (albums.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">album</span>
                <p>No albums found</p>
            </div>
        `;
        return;
    }

    albums.forEach(album => {
        const albumElement = document.createElement('div');
        albumElement.className = 'album-item';
        albumElement.innerHTML = `
            <div class="album-cover">
                <img src="${album.coverImage || 'svg/default-album.svg'}" alt="${album.title}">
                <div class="album-overlay">
                    <button class="play-album-btn" data-id="${album._id}">
                        <span class="material-symbols-outlined">play_arrow</span>
                    </button>
                </div>
            </div>
            <h4>${album.title}</h4>
            <p>${album.artist}</p>
            <button class="remove-favorite-album-btn" data-id="${album._id}">
                <span class="material-symbols-outlined">favorite</span>
            </button>
        `;
        container.appendChild(albumElement);
    });

    // Add event listeners
    container.querySelectorAll('.play-album-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const albumId = btn.getAttribute('data-id');
            playAlbum(albumId);
        });
    });

    container.querySelectorAll('.remove-favorite-album-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const albumId = btn.getAttribute('data-id');
            removeAlbumFromFavorites(albumId);
        });
    });
}

// Render playlists
function renderPlaylists(playlists) {
    if (playlists.length === 0) {
        playlistsGrid.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">playlist_add</span>
                <p>No playlists yet</p>
            </div>
        `;
        return;
    }

    playlistsGrid.innerHTML = '';
    playlists.forEach(playlist => {
        const playlistElement = document.createElement('div');
        playlistElement.className = 'playlist-item';
        playlistElement.innerHTML = `
            <div class="playlist-cover">
                <img src="${playlist.coverImage || 'svg/default-playlist.svg'}" alt="${playlist.name}">
                <div class="playlist-overlay">
                    <button class="play-playlist-btn" data-id="${playlist._id}">
                        <span class="material-symbols-outlined">play_arrow</span>
                    </button>
                </div>
            </div>
            <div class='playlist-info'>
            <div>
            <h4>${playlist.name}</h4>
            <p>${playlist.songs.length} songs</p>
            </div>
            <button class="delete-playlist-btn" data-id="${playlist._id}">
                <span class="material-symbols-outlined">delete</span>
            </button>
            </div>
        `;
        playlistsGrid.appendChild(playlistElement);
    });

    // Add event listeners
    playlistsGrid.querySelectorAll('.play-playlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const playlistId = btn.getAttribute('data-id');
            playPlaylist(playlistId);
        });
    });

    playlistsGrid.querySelectorAll('.delete-playlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const playlistId = btn.getAttribute('data-id');
            deletePlaylist(playlistId);
        });
    });
}

// Play song (redirect to main player)
function playSong(songId) {
    window.location.href = `index.html?play=song&id=${songId}`;
}

// Play album (redirect to main player)
function playAlbum(albumId) {
    window.location.href = `index.html?play=album&id=${albumId}`;
}

// Play playlist (redirect to main player)
function playPlaylist(playlistId) {
    window.location.href = `index.html?play=playlist&id=${playlistId}`;
}

// Remove song from favorites
async function removeSongFromFavorites(songId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_URL}/users/favorites/songs/${songId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to remove song from favorites');
        }

        showToast('Song removed from favorites', 'success');
        fetchUserProfile(); // Refresh data
    } catch (error) {
        console.error('Error removing song from favorites:', error);
        showToast('Error removing song from favorites', 'error');
    }
}

// Remove album from favorites
async function removeAlbumFromFavorites(albumId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_URL}/users/favorites/albums/${albumId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to remove album from favorites');
        }

        showToast('Album removed from favorites', 'success');
        fetchUserProfile(); // Refresh data
    } catch (error) {
        console.error('Error removing album from favorites:', error);
        showToast('Error removing album from favorites', 'error');
    }
}

// Delete playlist
async function deletePlaylist(playlistId) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete playlist');
        }

        showToast('Playlist deleted', 'success');
        loadPlaylists(); // Refresh playlists
    } catch (error) {
        console.error('Error deleting playlist:', error);
        showToast('Error deleting playlist', 'error');
    }
}

// Update user profile
async function updateProfile(formData) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const updatedUser = await response.json();
        
        // Update token if it was refreshed
        if (updatedUser.token) {
            localStorage.setItem('token', updatedUser.token);
        }
        
        showToast('Profile updated successfully', 'success');
        fetchUserProfile(); // Refresh data
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}

// Create new playlist
async function createPlaylist(playlistData) {
    const token = checkAuth();
    try {
        const response = await fetch(`${API_URL}/playlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(playlistData)
        });

        if (!response.ok) {
            throw new Error('Failed to create playlist');
        }

        showToast('Playlist created successfully', 'success');
        loadPlaylists(); // Refresh playlists
        closeModal();
    } catch (error) {
        console.error('Error creating playlist:', error);
        showToast('Error creating playlist', 'error');
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Open modal
function openModal() {
    createPlaylistModal.classList.add('active');
}

// Close modal
function closeModal() {
    createPlaylistModal.classList.remove('active');
    createPlaylistForm.reset();
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const html = document.documentElement;
    
    if (body.classList.contains('dark-theme')) {
        // Switch to light theme
        body.classList.remove('dark-theme');
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeIcon.textContent = 'dark_mode';
        showToast('Light mode enabled');
    } else {
        // Switch to dark theme
        body.classList.add('dark-theme');
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.textContent = 'light_mode';
        showToast('Dark mode enabled');
    }
}

// Apply saved theme
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const html = document.documentElement;
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = 'light_mode';
    } else {
        body.classList.remove('dark-theme');
        html.setAttribute('data-theme', 'light');
        themeIcon.textContent = 'dark_mode';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    showLoading();
    applySavedTheme();
    fetchUserProfile();

    // Sidebar navigation
    sidebarItems.forEach(item => {
        if (!item.classList.contains('home-link')) {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                
                // Update active sidebar item
                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Show selected section
                dashboardSections.forEach(s => s.classList.remove('active'));
                document.getElementById(`${section}-section`).classList.add('active');
            });
        }
    });

    // Profile form submission
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            name: nameInput.value,
            email: emailInput.value
        };
        
        if (passwordInput.value) {
            formData.password = passwordInput.value;
        }
        
        updateProfile(formData);
    });

    // Logout button
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Create playlist button
    createPlaylistBtn.addEventListener('click', openModal);

    // Close modal button
    closeModalBtn.addEventListener('click', closeModal);

    // Create playlist form submission
    createPlaylistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const playlistData = {
            name: e.target.elements.name.value,
            description: e.target.elements.description.value
        };
        createPlaylist(playlistData);
    });

    // Theme toggle
    themeIcon.addEventListener('click', toggleTheme);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === createPlaylistModal) {
            closeModal();
        }
    });

    // Check for token in URL (from Google OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        localStorage.setItem('token', token);
        // Remove token from URL to prevent sharing
        window.history.replaceState({}, document.title, '/dashboard.html');
        fetchUserProfile();
    }
});

// Add CSS for toast notifications
const style = document.createElement('style');
style.textContent = `
    .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }
    
    .toast {
        padding: 12px 20px;
        margin-top: 10px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
    }
    
    .toast.info {
        background-color: #2196F3;
    }
    
    .toast.success {
        background-color: #4CAF50;
    }
    
    .toast.error {
        background-color: #F44336;
    }
    
    .toast.hide {
        animation: slideOut 0.3s ease forwards;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style); 