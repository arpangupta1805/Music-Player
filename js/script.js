/**
 * Tuneflow Music Player
 * A modern music player with API integration
 */
// curl -X POST ${server_url}/api/albums/import to import albums we have to run this commamd
// DOM Elements
const playBtn = document.getElementById("play");
const previousBtn = document.getElementById("previous");
const nextBtn = document.getElementById("next");
const hamburger = document.getElementsByClassName("humburger")[0];
const inputCross = document.getElementsByClassName("clear-btn")[0];
const cardContainer = document.getElementsByClassName("cardContainer")[0];
const searchBar = document.getElementById("searchBar");
const searchContainer = document.getElementById("search-container");
const albumList = document.getElementById("albumList");
const songUL = document.getElementsByClassName("songList")[0];
const git_reponame = 'Music-Player';
// Global variables
let currentSong = new Audio();
let songs = [];
let currFolder = '';
let albums = [];
let songList = [];
let folders = [];

// API endpoints
const server_url = 'http://localhost:5002';
const API_URL = `${server_url}/api`;
const ENDPOINTS = {
  ALBUMS: `${API_URL}/albums`,
  SONGS: `${API_URL}/songs`,
  PLAYLISTS: `${API_URL}/playlists`,
  USERS: `${API_URL}/users`
};

// Initialize the app
(async function init() {
  // Show loading overlay
  const loadingOverlay = document.getElementById('loading-overlay');
  
  // Load albums and songs
  await getAlbums();
  
  // Set up event listeners
  setupEventListeners();
  
  // Update song time and seekbar when playing
  setupAudioEventListeners();
  
  // Initialize theme
  initializeTheme();
  
  // Initialize liked songs display
  updateLikedSongsDisplay();
  
  // Initialize authentication
  initializeAuth();
  
  // Check for play parameters in URL
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const playType = urlParams.get('play');
    const id = urlParams.get('id');
    
    if (playType && id) {
      // Remove parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Handle different play types
      switch (playType) {
        case 'song':
          await playSongById(id);
          break;
        case 'album':
          await playAlbumById(id);
          break;
        case 'playlist':
          await playPlaylistById(id);
          break;
      }
    }
  } catch (error) {
    showToast('Could not play the requested item', 'warning');
  }
  
  // Hide loading overlay after everything is loaded
  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
  }, 1000);
})();

/**
 * Initialize theme based on user preference
 */
function initializeTheme() {
  const themeIcon = document.getElementById('theme-icon');
  const storedTheme = localStorage.getItem('theme') || 'dark';
  
  // Set initial theme
  document.documentElement.setAttribute('data-theme', storedTheme);
  document.body.classList.toggle('dark-theme', storedTheme === 'dark');
  themeIcon.textContent = storedTheme === 'dark' ? 'light_mode' : 'dark_mode';
  
  // Add theme toggle event listener
  themeIcon.parentElement.addEventListener('click', toggleTheme);
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const themeIcon = document.getElementById('theme-icon');
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Update theme
  document.documentElement.setAttribute('data-theme', newTheme);
  document.body.classList.toggle('dark-theme', newTheme === 'dark');
  themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
  
  // Save preference
  localStorage.setItem('theme', newTheme);
  
  // Show toast notification
  showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`);
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Add icon based on type
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<span class="material-symbols-outlined">check_circle</span>';
      break;
    case 'error':
      icon = '<span class="material-symbols-outlined">error</span>';
      break;
    case 'warning':
      icon = '<span class="material-symbols-outlined">warning</span>';
      break;
    default:
      icon = '<span class="material-symbols-outlined">info</span>';
  }
  
  // Set toast content with icon
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close"><span class="material-symbols-outlined">close</span></button>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Add animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Add close button functionality
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
  
  // Auto remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Set up all event listeners for the app
 */
function setupEventListeners() {
  // Hamburger menu toggle
  hamburger.addEventListener("click", toggleSidebar);
  
  // Search functionality
  searchBar.addEventListener("keyup", handleSearch);
  searchBar.addEventListener("focus", handleSearchFocus);
  searchBar.addEventListener("blur", handleSearchBlur);
  searchContainer.addEventListener("click", () => searchBar.focus());
  
  // Album list click handler
  albumList.addEventListener("mousedown", handleAlbumListClick);
  
  // Card container click handler
  cardContainer.addEventListener("click", handleCardClick);
  
  // Song list click handler
  songUL.addEventListener("click", handleSongListClick);
  
  // Playback controls
  playBtn.addEventListener("click", togglePlay);
  previousBtn.addEventListener("click", playPrevious);
  nextBtn.addEventListener("click", playNext);
  
  // Volume controls
  document.querySelector('.volumebtn').addEventListener('click', toggleMute);
  document.querySelector('.range').addEventListener('change', adjustVolume);
  
  // Seekbar controls
  setupSeekbarControls();
  
  // Keyboard controls
  document.addEventListener("keydown", handleKeyboardControls);
  
  // View options
  setupViewOptions();
  
  // Like button
  document.querySelector('.like-btn').addEventListener('click', handleLikeClick);
  
  // Shuffle and repeat buttons
  document.querySelector('.shuffle-btn').addEventListener('click', toggleShuffle);
  document.querySelector('.repeat-btn').addEventListener('click', toggleRepeat);
  
  // Filter buttons
  setupFilterButtons();
  
  // Queue button
  document.querySelector('.queue-btn').addEventListener('click', toggleQueuePanel);
  document.querySelector('.close-queue').addEventListener('click', toggleQueuePanel);
}

/**
 * Set up view options (grid/list view)
 */
function setupViewOptions() {
  const viewButtons = document.querySelectorAll('.view-btn');
  const cardContainer = document.querySelector('.cardContainer');
  
  // Check if there's a saved view preference
  const savedView = localStorage.getItem('viewMode') || 'grid';
  
  // Apply saved view
  if (savedView === 'list') {
    cardContainer.classList.add('list-view');
    viewButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === 'list');
    });
  }
  
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      viewButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Update view
      const view = btn.dataset.view;
      
      if (view === 'list') {
        cardContainer.classList.add('list-view');
        showToast('List view enabled');
      } else {
        cardContainer.classList.remove('list-view');
        showToast('Grid view enabled');
      }
      
      // Save preference
      localStorage.setItem('viewMode', view);
      });
    });
  }

/**
 * Set up filter buttons
 */
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Get filter value
      const filter = button.getAttribute('data-filter');
      
      // Apply filter
      filterLibraryContent(filter);
    });
  });
  
  // Set default filter
  filterLibraryContent('all');
}

/**
 * Filter library content based on selected filter
 */
function filterLibraryContent(filter) {
  const songList = document.querySelector('.songList');
  songList.innerHTML = '';
  
  switch (filter) {
    case 'my-playlists':
      // Load user playlists if logged in
      const token = localStorage.getItem('token');
      if (token) {
        loadUserPlaylists(songList);
      } else {
        songList.innerHTML = `
          <div class="empty-state">
            <span class="material-symbols-outlined">login</span>
            <p>Please login to view your playlists</p>
          </div>
        `;
      }
      break;
    case 'playlists':
      // Load featured playlists
      displayFeaturedPlaylists(songList);
      break;
    case 'albums':
      // Load albums
      displayAlbums(songList);
      break;
    case 'artists':
      // Load artists
      displayArtists(songList);
      break;
    default:
      // Load all content
      displaySongsInUI(songs);
  }
}

/**
 * Load user playlists
 */
async function loadUserPlaylists(container) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${ENDPOINTS.PLAYLISTS}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      showToast('Failed to fetch playlists', 'error');
    }
    
    const playlists = await response.json();
    
    if (playlists.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">playlist_add</span>
          <p>You don't have any playlists yet</p>
          <button class="btn-primary create-playlist-btn">
            <span class="material-symbols-outlined">add</span>
            Create Playlist
          </button>
        </div>
      `;
      
      // Add event listener to create playlist button
      const createPlaylistBtn = container.querySelector('.create-playlist-btn');
      if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', () => {
          window.location.href = 'dashboard.html#playlists';
        });
      }
    } else {
      // Display playlists
      container.innerHTML = '';
      
      playlists.forEach(playlist => {
        const playlistItem = document.createElement('li');
        playlistItem.className = 'playlist-item';
        playlistItem.innerHTML = `
          <div class="playlist-info">
            <h4>${playlist.name}</h4>
            <p>${playlist.songs.length} songs</p>
          </div>
          <button class="play-playlist-btn" data-id="${playlist._id}">
            <span class="material-symbols-outlined">play_arrow</span>
          </button>
        `;
        
        container.appendChild(playlistItem);
      });
      
      // Add event listeners to play buttons
      container.querySelectorAll('.play-playlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const playlistId = btn.getAttribute('data-id');
          playPlaylistById(playlistId);
        });
      });
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">error</span>
        <p>Error loading playlists</p>
      </div>
    `;
  }
}

/**
 * Play playlist by ID
 */
async function playPlaylistById(playlistId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to play playlists', 'warning');
      return;
    }
    
    const response = await fetch(`${ENDPOINTS.PLAYLISTS}/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      showToast('Could not load this playlist', 'warning');
      return;
    }
    
    const playlist = await response.json();
    
    if (!playlist) {
      showToast('Could not load this playlist', 'warning');
      return;
    }
    
    if (!playlist.songs || playlist.songs.length === 0) {
      showToast('This playlist is empty', 'info');
      return;
    }
    
    // Fetch first song and play it
    try {
      const firstSongResponse = await fetch(`${ENDPOINTS.SONGS}/${playlist.songs[0]}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!firstSongResponse.ok) {
        showToast('Could not play the first song in this playlist', 'warning');
        return;
      }
      
      const firstSong = await firstSongResponse.json();
      
      // Get the album to find the folder name
      let folderName = '';
      if (firstSong.album && firstSong.album.folderName) {
        folderName = firstSong.album.folderName;
      } else if (firstSong.album) {
        // Fetch album details if folderName is not included
        try {
          const albumResponse = await fetch(`${ENDPOINTS.ALBUMS}/${firstSong.album}`);
          if (albumResponse.ok) {
            const album = await albumResponse.json();
            folderName = album.folderName;
          }
        } catch (albumError) {
        }
      }
      
      // Construct the file path
      let filePath = '';
      if (firstSong.filePath) {
        filePath = firstSong.filePath;
      } else if (folderName) {
        filePath = `${server_url}/songs/${folderName}/${firstSong.name}.mp3`;
      } else {
        showToast('Could not play this song', 'warning');
        return;
      }
      
      // Play the song
      playMusic({
        name: firstSong.name,
        filePath: filePath
      });
      
      // Try to load all songs in this album if we have a folder name
      if (folderName) {
        await getSongs(`${server_url}/songs/${folderName}`);
      }
      
      // Show success message
      showToast(`Playing playlist: ${playlist.name}`, 'success');
    } catch (songError) {
      showToast('Could not play the first song in this playlist', 'warning');
    }
  } catch (error) {
    showToast('Could not play this playlist', 'warning');
  }
}

/**
 * Handle like button click
 */
function handleLikeClick() {
  const likeBtn = document.querySelector('.like-btn');
  const icon = likeBtn.querySelector('span');
  
  // Get current song info
  const currentSongName = decodeURI(currentSong.src.split("/").pop());
  const folderName = currFolder.split('/').pop();
  const songName = formatSongName(currentSongName);
  
  if (icon.textContent === 'favorite_border') {
    // Like the song
    icon.textContent = 'favorite';
    icon.style.color = '#1DB954';
    showToast('Added to your Liked Songs');
    
    // Add to liked songs in localStorage
    addToLikedSongs(currentSongName, folderName, songName);
    
    // Update liked songs display
    updateLikedSongsDisplay();
    
    // If we have a current song and its ID, like it via API
    const songElement = document.querySelector(`.song[data-name="${currentSongName}"]`);
    
    if (songElement && songElement.dataset.id) {
      fetch(`${ENDPOINTS.SONGS}/${songElement.dataset.id}/like`, {
        method: 'PUT'
      }).catch(err => console.error("Error liking song:", err));
    }
  } else {
    // Unlike the song
    icon.textContent = 'favorite_border';
    icon.style.color = '';
    showToast('Removed from your Liked Songs');
    
    // Remove from liked songs in localStorage
    removeFromLikedSongs(currentSongName);
    
    // Update liked songs display
    updateLikedSongsDisplay();
  }
}

/**
 * Add a song to liked songs
 */
function addToLikedSongs(songFileName, folder, songName) {
  // Get current liked songs list
  const likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
  
  // Check if song is already in the list
  const songIndex = likedSongs.findIndex(song => song.fileName === songFileName);
  
  if (songIndex === -1) {
    // Add song to the list
    likedSongs.push({
      fileName: songFileName,
      name: songName,
      folder: folder,
      timestamp: Date.now()
    });
    
    // Save to localStorage
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }
}

/**
 * Remove a song from liked songs
 */
function removeFromLikedSongs(songFileName) {
  // Get current liked songs list
  const likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
  
  // Remove song from the list
  const updatedList = likedSongs.filter(song => song.fileName !== songFileName);
  
  // Save to localStorage
  localStorage.setItem('likedSongs', JSON.stringify(updatedList));
}

/**
 * Update the liked songs display
 */
function updateLikedSongsDisplay() {
  try {
    const likedSongsList = document.querySelector('.liked-songs-list');
    if (!likedSongsList) {
      return;
    }
    
    const likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
    
    if (likedSongs.length === 0) {
      likedSongsList.innerHTML = '<p class="liked-songs-empty">You haven\'t liked any songs yet.</p>';
      return;
    }
    
    // Filter out entries with missing folder or fileName
    const validSongs = likedSongs.filter(song => song && song.folder && song.fileName);
    
    if (validSongs.length === 0) {
      likedSongsList.innerHTML = '<p class="liked-songs-empty">You haven\'t liked any songs yet.</p>';
      return;
    }
    
    likedSongsList.innerHTML = '';
    
    // Sort by most recently liked
    validSongs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display liked songs
    validSongs.forEach(song => {
      likedSongsList.innerHTML += `
        <div class="liked-song-item" data-folder="${song.folder}" data-filename="${song.fileName}">
          <img src='${server_url}/songs/${song.folder}/cover.jpg' alt='${song.folder} cover' >
          <div class="liked-song-info">
            <h4>${song.name || formatSongName(song.fileName)}</h4>
            <p>${song.folder}</p>
          </div>
          <div class="liked-song-actions">
            <img src="/${git_reponame}/svg/play.svg" alt="play button" class="play-btn">
            <button class="unlike-btn">
              <span class="material-symbols-outlined">favorite</span>
            </button>
        </div>
        </div>`;
    });
    
    // Add event listeners to play buttons
    document.querySelectorAll('.liked-song-item .play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        try {
          const item = e.target.closest('.liked-song-item');
          if (!item) return;
          
          const folder = item.dataset.folder;
          const fileName = item.dataset.filename;
          
          if (!folder || !fileName) {
            showToast('Invalid song information', 'warning');
            return;
          }
          
          playSongFromLikedList(folder, fileName);
        } catch (error) {
          showToast('Could not play this song', 'warning');
        }
      });
    });
    
    // Add event listeners to unlike buttons
    document.querySelectorAll('.liked-song-item .unlike-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        try {
          const item = e.target.closest('.liked-song-item');
          if (!item) return;
          
          const fileName = item.dataset.filename;
          
          if (!fileName) {
            showToast('Invalid song information', 'warning');
            return;
          }
          
          removeFromLikedSongs(fileName);
          updateLikedSongsDisplay();
          showToast('Removed from your Liked Songs');
          
          // Update like button if this is the currently playing song
          if (currentSong.src.includes(fileName)) {
            const likeBtn = document.querySelector('.like-btn');
            if (likeBtn) {
              const icon = likeBtn.querySelector('span');
              if (icon) {
                icon.textContent = 'favorite_border';
                icon.style.color = '';
              }
            }
          }
        } catch (error) {
          showToast('Could not remove this song', 'warning');
        }
      });
    });
  } catch (error) {
    
    // Try to reset the liked songs list if it's corrupted
    try {
      const likedSongsList = document.querySelector('.liked-songs-list');
      if (likedSongsList) {
        likedSongsList.innerHTML = '<p class="liked-songs-empty">You haven\'t liked any songs yet.</p>';
      }
    } catch (resetError) {
    }
  }
}

/**
 * Play a song from the liked songs list
*/
async function playSongFromLikedList(folder, fileName) {
  try {
    // Validate inputs
    if (!folder || !fileName) {
      showToast('Invalid song information', 'warning');
      return;
    }
    
    // Set current folder with the correct URL
    currFolder = `${server_url}/songs/${folder}`;
    
    // Try to play the song directly first
    const songPath = `${server_url}/songs/${folder}/${fileName}`;
    
    try {
      // Check if the song exists
      const checkResponse = await fetch(songPath, { method: 'HEAD' });
      
      if (checkResponse.ok) {
        // Song exists, play it directly
        playMusic(fileName, false, songPath);
        
        // Add to recently played
        addToRecentlyPlayed(fileName, folder);
        
        showToast(`Playing: ${formatSongName(fileName)}`, 'success');
        return;
      }
    } catch (checkError) {
      console.error('Error checking song existence:', checkError);
    }
    
    // If direct play failed, try to find the song in the API
    try {
      const response = await fetch(`${ENDPOINTS.SONGS}`);
      if (response.ok) {
        const allSongs = await response.json();
        // Find the song that matches the file name
        const song = allSongs.find(s => s.name + '.mp3' === fileName || s.filePath.includes(fileName));
        
        if (song) {
          // Play the song using the API data
          playMusic({
            name: song.name,
            filePath: song.filePath || `${server_url}/songs/${folder}/${fileName}`
          });
          
          // Add to recently played
          addToRecentlyPlayed(fileName, folder);
          
          showToast(`Playing: ${formatSongName(song.name)}`, 'success');
          return;
        }
      }
    } catch (apiError) {
      showToast('Could not play this song due to some Technical Issues.', 'warning');
    }
    
    // Last resort: try to play the song directly
    playMusic(fileName, false, songPath);
    
    // Add to recently played
    addToRecentlyPlayed(fileName, folder);
    
    showToast(`Playing: ${formatSongName(fileName)}`, 'success');
  } catch (error) {
    showToast('Could not play this song', 'warning');
  }
}

/**
 * Toggle shuffle mode
 */
function toggleShuffle() {
  const shuffleBtn = document.querySelector('.shuffle-btn');
  shuffleBtn.classList.toggle('active');
  
  if (shuffleBtn.classList.contains('active')) {
    showToast('Shuffle mode: On');
  } else {
    showToast('Shuffle mode: Off');
  }
}

/**
 * Toggle repeat mode
 */
function toggleRepeat() {
  const repeatBtn = document.querySelector('.repeat-btn');
  const icon = repeatBtn.querySelector('span');
  
  if (!repeatBtn.classList.contains('active')) {
    // First click: Repeat all
    repeatBtn.classList.add('active');
    icon.textContent = 'repeat';
    showToast('Repeat mode: All');
  } else if (icon.textContent === 'repeat') {
    // Second click: Repeat one
    icon.textContent = 'repeat_one';
    showToast('Repeat mode: One');
  } else {
    // Third click: No repeat
    repeatBtn.classList.remove('active');
    icon.textContent = 'repeat';
    showToast('Repeat mode: Off');
  }
}

/**
 * Set up audio event listeners for the current song
 */
function setupAudioEventListeners() {
  currentSong.addEventListener("timeupdate", updateSongProgress);
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
  const leftElement = document.querySelector(".left");
  const overlay = document.createElement('div');
  
  if (!leftElement.classList.contains("open")) {
    // Opening the sidebar
    leftElement.classList.add("open");
    hamburger.innerHTML = 'close';
    leftElement.style.left = '0%';
    
    // Add overlay when sidebar is open
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    // Close sidebar when clicking outside
    overlay.addEventListener('click', () => {
      toggleSidebar();
    });
  } else {
    // Closing the sidebar
    leftElement.classList.remove("open");
    hamburger.innerHTML = 'menu';
    leftElement.style.left = '-100%';
    
    // Remove overlay when sidebar is closed
    const existingOverlay = document.querySelector('.sidebar-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
  }
}

/**
 * Handle search input changes
 */
function handleSearch() {
  let filter = searchBar.value.toLowerCase();
  let filteredSongs = songList.filter((song) => song.name.toLowerCase().includes(filter));
  showSongs(filteredSongs);
}

/**
 * Handle search focus event
 */
function handleSearchFocus() {
  albumList.classList.add("show");
  document.querySelector('.search-overlay').classList.add('show');
  fetchSongs();
}

/**
 * Handle search blur event
 */
function handleSearchBlur() {
  setTimeout(() => {
    albumList.classList.remove("show");
    document.querySelector('.search-overlay').classList.remove('show');
  }, 300); 
}

/**
 * Handle album list click event
 */
async function handleAlbumListClick(event) {
  let song = event.target.closest(".song");
  if (song) {
    let folderName = song.querySelector("#album_name").innerText;
    let songName = song.dataset.name;
    await playSongFromSearchBar(folderName, songName);
    hamburger.click();
  }
}

/**
 * Handle card click event
 */
async function handleCardClick(event) {
  try {
    const card = event.currentTarget;
    const folder = card.dataset.folder;
    if (!folder) {
      showToast('Invalid album folder', 'warning');
      return;
    }
    
    // CORRECTED: Properly set currFolder with full path
    await getSongs(`${server_url}/songs/${folder}`);
  } catch (error) {
    showToast('Could not load this album', 'warning');
  }
}

/**
 * Handle song list click event
 */
function handleSongListClick(event) {
  const li = event.target.closest('li');
  if (!li) return;

  const index = Array.from(li.parentNode.children).indexOf(li);
  playBtn.innerHTML = "pause";
  playMusic(songs[index]);
}

/**
 * Toggle play/pause
 */
function togglePlay() {
  if (currentSong.paused) {
    playBtn.innerHTML = "pause";
    currentSong.play();
  } else {
    playBtn.innerHTML = "play_circle";
    currentSong.pause();
  }
}

/**
 * Play previous song
 */
function playPrevious() {
  const currentSongName = decodeURI(currentSong.src.split("/").pop());
  const index = songs.findIndex(song => decodeURI(song) === currentSongName);
  if ((index-1) >= 0) {
    if (!currentSong.paused) {
      playMusic(songs[index - 1]);
    } else {
      playMusic(songs[index-1], true);
    }
  }
}

/**
 * Play next song
 */
function playNext() {
  const currentSongName = decodeURI(currentSong.src.split("/").pop());
  const index = songs.findIndex(song => song === currentSongName);
  // const index = songs.findIndex(song => decodeURI(song) === currentSongName);
  if ((index+1) < songs.length) {
    if (!currentSong.paused) {
      playMusic(songs[index + 1]);
    } else {
      playMusic(songs[index+1], true);
    }
  }
}

/**
 * Toggle mute/unmute
 */
function toggleMute() {
  if (currentSong.volume === 0) {
    currentSong.volume = 0.5;
    document.querySelector('.range').value = 50;
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_up';
  } else {
    currentSong.volume = 0;
    document.querySelector('.range').value = 0;
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_off';
  }
}

/**
 * Adjust volume
 */
function adjustVolume() {
  let currentVolume = parseInt(document.querySelector('.range').value);
  currentSong.volume = currentVolume / 100;
  
  if (currentVolume === 0) {
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_off';
  } else if (currentVolume > 0 && currentVolume <= 50) {
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_down';
  } else {
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_up';
  }
}

/**
 * Set up seekbar controls
 */
function setupSeekbarControls() {
  const seekbarContainer = document.querySelector(".seekbar-container");
  let isDragging = false;
  
  seekbarContainer.addEventListener("mousedown", (event) => {
    isDragging = true;
    updateSeekPosition(event);
  });
  
  document.addEventListener("mousemove", (event) => {
    if (isDragging) {
      updateSeekPosition(event);
    }
  });
  
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
  
  seekbarContainer.addEventListener("click", (event) => {
    updateSeekPosition(event);
  });
  
  function updateSeekPosition(event) {
    const rect = seekbarContainer.getBoundingClientRect();
    const clickPosition = (event.clientX - rect.left) / rect.width;
    const seekPosition = clickPosition * currentSong.duration;
    
    if (!isNaN(seekPosition) && isFinite(seekPosition)) {
      currentSong.currentTime = seekPosition;
    }
  }
}

/**
 * Handle keyboard controls
 */
function handleKeyboardControls(event) {
  // Check if the currently focused element is not an input, textarea, or other selectable element
  const focusedElement = document.activeElement;
  const isInputField = focusedElement.tagName === "INPUT" || focusedElement.tagName === "TEXTAREA";
  
  // Prevent the function if an input or textarea is focused
  if (isInputField) return;
  
  // Handle the space key
  if (event.code === "Space") {
    event.preventDefault(); // Prevent default scrolling behavior
    togglePlay();
  }
  
  // Handle the left arrow key
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    currentSong.currentTime -= 5;
  }
  
  // Handle the right arrow key
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    currentSong.currentTime += 5;
  }
  
  // Handle the up arrow key
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    let newVolume = Math.min(1, currentSong.volume + 0.1);
    currentSong.volume = newVolume;
    document.querySelector('.range').value = newVolume * 100;
    updateVolumeIcon(newVolume);
  }
  
  // Handle the down arrow key
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    let newVolume = Math.max(0, currentSong.volume - 0.1);
    currentSong.volume = newVolume;
    document.querySelector('.range').value = newVolume * 100;
    updateVolumeIcon(newVolume);
  }
}

/**
 * Update volume icon based on volume level
 */
function updateVolumeIcon(volume) {
  if (volume <= 0) {
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_off';
  } else if (volume <= 0.5) {
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_down';
  } else {
    document.querySelector('.volumeup').firstElementChild.innerHTML = 'volume_up';
  }
}

/**
 * Update song progress (time and seekbar)
 */
function updateSongProgress() {
  if (!isNaN(currentSong.duration)) {
    // Update time display
    const currentTimeStr = formatTime(currentSong.currentTime);
    const durationStr = formatTime(currentSong.duration);
    
    document.querySelector(".songtime").innerHTML = `${currentTimeStr} / ${durationStr}`;
    document.querySelector(".current-time").textContent = currentTimeStr;
    document.querySelector(".total-time").textContent = durationStr;
    
    // Update seekbar
    document.querySelector(".line").style.width =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  }
  
  // Auto-play next song when current song ends
  if (currentSong.ended) {
    const repeatBtn = document.querySelector('.repeat-btn');
    const icon = repeatBtn.querySelector('span');
    
    if (repeatBtn.classList.contains('active') && icon.textContent === 'repeat_one') {
      // Repeat current song
      currentSong.currentTime = 0;
      currentSong.play()
        .catch(err => console.error("Error replaying song:", err));
    } else {
      // Play next song
      setTimeout(() => {
        playNext();
      }, 500);
    }
  }
}

/**
 * Format time in seconds to MM:SS format
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === 0) {
    return "00:00";
  }
  
  // Ensure seconds is a whole number
  seconds = Math.floor(seconds);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    // Format as HH:MM:SS (zero-padded)
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(2, "0")}`;
  } else {
    // Format as MM:SS (zero-padded)
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }
}

/**
 * Toggle clear button visibility
 */
function toggleClearButton(inputElement) {
  const clearButton = inputElement.nextElementSibling;
  clearButton.style.display = inputElement.value ? 'block' : 'none';
}

/**
 * Clear the input field
 */
function clearInput(buttonElement) {
  const inputElement = buttonElement.previousElementSibling;
  inputElement.value = '';
  buttonElement.style.display = 'none';
  
  // Clear search results
  albumList.classList.remove("show");
  document.querySelector('.search-overlay').classList.remove('show');
}

/**
 * Fetch all songs from all albums
 */
async function fetchSongs() {
  try {
    // First try to use the API
    const response = await fetch(`${ENDPOINTS.SONGS}`);
    if (response.ok) {
      const data = await response.json();
      songList = data.map(song => ({
        name: song.name,
        folder: song.album.title,
        albumName: song.album.folderName,
        id: song._id
      }));
      showSongs(songList);
    } else {
      // Fallback to file system approach
      fallbackFetchSongs();
    }
  } catch (error) {
    console.error("Error fetching songs from API:", error);
    // Fallback to file system approach
    fallbackFetchSongs();
  }
}

/**
 * Fallback method to fetch songs from file system
 */
async function fallbackFetchSongs() {
  songList = [];
  for (let folder of folders) {
    try {
      // let response = await fetch(`songs/${folder}/info.json`);
      let response = await fetch(`${API_URL}/songs/${folder}/info.json`);
      let data = await response.json();
      data.songs.forEach((song) => {
        songList.push({
          name: song,
          folder: data.title,
          albumName: folder,
        });
      });
    } catch (error) {
      console.error(`Error fetching songs from folder ${folder}:`, error);
    }
  }
  showSongs(songList);
}

/**
 * Display songs in the album list
 */
function showSongs(songs) {
  albumList.innerHTML = "";
  if (songs.length === 0) {
    albumList.innerHTML = "<h3 style='font-size:1.4rem'>No songs found</h3>";
    return;
  }
  
  songs.forEach((song) => {
    // Format song name to remove file extension and clean up formatting
    let displayName = formatSongName(song.name);
    
    let songItem = `
      <div class="song" data-name="${song.name}" ${song.id ? `data-id="${song.id}"` : ''}>
        <p class="material-symbols-outlined">music_note</p>
        <div>
          <h4>${displayName}</h4>
          <span class="tab-space">${song.folder}</span>
          <span id="album_name" hidden>${song.albumName}</span>
        </div>
        <img id="playbtn" src="/${git_reponame}/svg/play.svg" alt="Play Button">
      </div>
    `;
    albumList.innerHTML += songItem;
  });
}

/**
 * Format song name for display
 */

function formatSongName(songName) {
  songName = songName?.name || songName; 

  if (typeof songName !== 'string') {
    return ''; 
  }

  let name = songName.replace(/\.(mp3|wav|ogg)$/i, '').trim();

  // Split by common separators (Title-Artist))
  let parts = name.split(/\s*[-–—]\s*/);
  
  // If format is "Artist - Title", return the title (last part)
  if (parts.length > 1) {
    return parts[parts.length - 2].trim();
  }

  // Otherwise, return the cleaned name
  return name;
}
/**
 * Play a song from the search bar
 */
async function playSongFromSearchBar(folder, songName) {
  try {
    // Set current folder
    currFolder = `${server_url}/songs/${folder}`;
    
    // Try to use the API first
    try {
      const response = await fetch(`${ENDPOINTS.ALBUMS}`);
      if (response.ok) {
        const albums = await response.json();
        const album = albums.find(a => a.folderName === folder);
        
        if (album) {
          // Fetch songs for this album
          const songsResponse = await fetch(`${ENDPOINTS.SONGS}`);
          if (songsResponse.ok) {
            const allSongs = await songsResponse.json();
            if (album && album._id) {
              const albumSongs = allSongs.filter(s => s.album && s.album._id === album._id);
              songs = albumSongs.map(s => s.name + '.mp3');
              
              // Find the specific song
              const song = albumSongs.find(s => s.name.toLowerCase() === songName.toLowerCase());
              
              if (song) {
                // Play the song
                const songPath = `${server_url}/songs/${folder}/${songName}.mp3`;
                playMusic(songName + '.mp3', false, songPath);
                
                // Increment play count
                fetch(`${ENDPOINTS.SONGS}/${song._id}/play`, {
                  method: 'PUT'
                }).catch(err => console.log("Error incrementing play count:", err));
                
                // Display songs in the UI
                displaySongsInUI(albumSongs);
                return;
              }
            }
          }
        }
      }
    } catch (apiError) {
      showToast('Trying alternative method to play song...', 'info');
    }
    
    // Fallback to direct file access
    try {
      const songPath = `${server_url}/songs/${folder}/${songName}.mp3`;
      
      // Check if the song exists before trying to play it
      const checkResponse = await fetch(songPath, { method: 'HEAD' });
      
      if (checkResponse.ok) {
        playMusic(songName + '.mp3', false, songPath);
        
        // Try to load all songs in this folder
        fallbackGetSongs(`${server_url}/songs/${folder}`);
      } else {
        showToast('Song file not found. Trying alternative method...', 'info');
        
        // Try fallback method
        fallbackPlaySongFromSearchBar(folder, songName);
      }
    } catch (directError) {
      showToast('Trying alternative method to play song..., Album not found', 'info');
      
      // Try fallback method
      fallbackPlaySongFromSearchBar(folder, songName);
    }
  } catch (error) {
    showToast('Could not play this song. Song path not found', 'warning');
    
    // Try fallback method as last resort
    fallbackPlaySongFromSearchBar(folder, songName);
  }
}

/**
 * Fallback method to play a song from the search bar
 */
async function fallbackPlaySongFromSearchBar(folder, songName) {
  try {
    // Set current folder
    currFolder = `${server_url}/songs/${folder}`;
    
    // Try to get songs from the folder
    try {
      // Try to play the song directly without fetching the folder contents
      const songPath = `${server_url}/songs/${folder}/${songName}.mp3`;
      
      // Check if the song exists
      try {
        const checkResponse = await fetch(songPath, { method: 'HEAD' });
        
        if (checkResponse.ok) {
          // Song exists, play it
          playMusic(songName + '.mp3', false, songPath);
          
          // Try to load all songs in this folder in the background
          setTimeout(() => {
            try {
              fetch(`${server_url}/songs/${folder}/`)
                .then(response => {
                  if (response.ok) return response.text();
                  return null;
                })
                .then(data => {
                  if (data) {
                    let div = document.createElement("div");
                    div.innerHTML = data;
                    let as = div.getElementsByTagName("a");
                    let folderSongs = [];
                    
                    for (let index = 0; index < as.length; index++) {
                      const element = as[index];
                      if (element.innerText.endsWith(".mp3")) {
                        folderSongs.push(element.innerText);
                      }
                    }
                    
                    if (folderSongs.length > 0) {
                      songs = folderSongs;
                      displaySongsFromFileSystem(songs);
                    }
                  }
                })
                .catch(err => console.log('Error loading folder songs in background:', err));
            } catch (err) {
              console.warn('Error in background folder loading:', err);
            }
          }, 1000);
          
          return;
        }
      } catch (checkError) {
        console.warn('Error checking song existence:', checkError);
      }
      
      // If direct play failed, try to get folder contents
      let response = await fetch(`${server_url}/songs/${folder}/`);
      
      if (!response.ok) {
        showToast('Could not find songs in this folder', 'warning');
        return;
      }
      
      const data = await response.text();
      let div = document.createElement("div");
      div.innerHTML = data;
      let as = div.getElementsByTagName("a");
      songs = [];
      
      for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.innerText.endsWith(".mp3")) {
          songs.push(element.innerText);
        }
      }
      
      // Find the song in the list
      const song = songs.find(s => s.toLowerCase().includes(songName.toLowerCase()));
      
      if (song) {
        // Play the song
        let path = `${server_url}/songs/${folder}/${song}`;
        playMusic(song, false, path);
        
        // Display songs in the UI
        displaySongsFromFileSystem(songs);
      } else {
        // Try direct playback
        let path = `${server_url}/songs/${folder}/${songName}.mp3`;
        playMusic(songName + '.mp3', false, path);
        
        // Display empty song list with a message
        if (songs.length > 0) {
          displaySongsFromFileSystem(songs);
        } else {
          displayEmptySongsList();
        }
      }
    } catch (fetchError) {
      console.warn('Error fetching folder contents:', fetchError);
      
      // Try direct playback as last resort
      let path = `${server_url}/songs/${folder}/${songName}.mp3`;
      playMusic(songName + '.mp3', false, path);
      displayEmptySongsList();
    }
  } catch (error) {
    showToast('Could not play this song', 'warning');
    displayEmptySongsList();
  }
}
/**
 * Get songs for a specific album
 */
async function getSongs(folder, folderpath='') {
  try {
    // Extract folder name from path
    const folderName = folder.split('/').pop();    
    // Try to use the API first
    const response = await fetch(`${ENDPOINTS.ALBUMS}`);
    if (response.ok) {
      const albums = await response.json();
      const album = albums.find(a => a.folderName === folderName);
      if (album) {
        // Fetch songs for this album
        const songsResponse = await fetch(`${ENDPOINTS.SONGS}`);
        if (songsResponse.ok) {
          const allSongs = await songsResponse.json();
          // Check if album exists and has an _id before filtering
          if (album && album._id) {
            const albumSongs = allSongs.filter(s => s.album && s.album._id === album._id);
            currFolder = folder;
            songs = albumSongs.map(s => s.name + '.mp3');
            // Increment album play count
            fetch(`${ENDPOINTS.ALBUMS}/${album._id}/play`, {
              method: 'PUT'
            }).catch(err => console.log('Error incrementing play count:', err));
            
            // Load first song if current song is paused
            if (currentSong.paused && songs.length > 0) {
              playMusic(songs[0]);
              playBtn.innerHTML = "pause";
            }
            
            // Display songs in the UI
            displaySongsInUI(albumSongs);
            return;
          } else {
            // Try to fetch songs directly by folder name
            try {
              const folderSongsResponse = await fetch(`${ENDPOINTS.SONGS}/${folderName}`);
              if (folderSongsResponse.ok) {
                const folderSongs = await folderSongsResponse.json();
                currFolder = folder;
                songs = folderSongs.map(s => s.name + '.mp3');
                
                // Load first song if current song is paused
                if (currentSong.paused && songs.length > 0) {
                  playMusic(songs[0]);
                  playBtn.innerHTML = "pause";
                }
                
                // Display songs in the UI
                displaySongsInUI(folderSongs);
                return;
              }
            } catch (folderError) {
              showToast('Could not load songs for this album. Trying alternative method...', 'warning');
            }
          }
        }
      }
    }
    
    // Fallback to file system approach
    fallbackGetSongs(folder, folderpath);
  } catch (error) {
    showToast('Could not load songs. Trying alternative method...', 'warning');
    // Fallback to file system approach
    fallbackGetSongs(folder, folderpath);
  }
}

/**
 * Fallback method to get songs for a specific album using file system
 */
async function fallbackGetSongs(folder, folderpath='') {
  try {
    currFolder = folder;
    let response;
    
    try {
      if (folderpath) {
        response = await fetch(folderpath);
      } else {
        // Try to fetch directly from the backend songs folder
        // Extract folder name from path
        const folderName = folder.split('/').pop();
        response = await fetch(`${server_url}/songs/${folderName}/`);
      }
      
      if (!response.ok) {
        // Don't throw error, just show toast and try alternative method
        showToast('Trying alternative method to load songs...', 'info');
        // Try direct access to individual song files instead
        displayEmptySongsList();
        return;
      }
      
      const data = await response.text();
      let div = document.createElement("div");
      div.innerHTML = data;
      let as = div.getElementsByTagName("a");
      songs = [];
      
      for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.innerText.endsWith(".mp3")) {
          songs.push(element.innerText);
        }
      }
      
      if (songs.length === 0) {
        showToast('No songs found in this album', 'warning');
        displayEmptySongsList();
        return;
      }
      
      if (currentSong.paused && songs.length > 0) {
        playMusic(songs[0]);
        if (!currentSong.paused) {
          playBtn.innerHTML = "pause";
        }
      }
      
      // Display songs in the UI
      displaySongsFromFileSystem(songs);
    } catch (fetchError) {
      console.warn(`Error fetching songs from folder ${folder}:`, fetchError);
      
      // Try one more approach - direct access to the backend songs folder
      try {
        const folderName = folder.split('/').pop();
        const directResponse = await fetch(`${server_url}/songs/${folderName}/`);
        
        if (!directResponse.ok) {
          // Don't throw error, just show toast
          showToast('Could not load songs for this album', 'warning');
          displayEmptySongsList();
          return;
        }
        
        const data = await directResponse.text();
        let div = document.createElement("div");
        div.innerHTML = data;
        let as = div.getElementsByTagName("a");
        songs = [];
        
        for (let index = 0; index < as.length; index++) {
          const element = as[index];
          if (element.innerText.endsWith(".mp3")) {
            songs.push(element.innerText);
          }
        }
        
        if (songs.length === 0) {
          showToast('No songs found in this album', 'warning');
          displayEmptySongsList();
          return;
        }
        
        if (currentSong.paused && songs.length > 0) {
          playMusic(songs[0]);
          if (!currentSong.paused) {
            playBtn.innerHTML = "pause";
          }
        }
        
        // Display songs in the UI
        displaySongsFromFileSystem(songs);
      } catch (directError) {
        showToast('Could not load songs for this album', 'warning');
        displayEmptySongsList();
      }
    }
  } catch (error) {
    showToast('Could not load songs for this album', 'warning');
    displayEmptySongsList();
  }
}

/**
 * Display empty songs list
 */
function displayEmptySongsList() {
  songUL.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined">music_note</span>
      <p>No songs available</p>
    </div>
  `;
}

/**
 * Display songs in the UI from API data
 */
function displaySongsInUI(songs) {
  songUL.innerHTML = "";
  
  songs.forEach((song, index) => {
    // Format song name for display
    let displayName = formatSongName(song.name);
    let artist = song.artist || 'Unknown Artist';
    
    songUL.innerHTML += `
      <li data-id="${song._id}">
        <p id='index' hidden>${index}</p>
        <p class="material-symbols-outlined">music_note</p>
        <div class="info">
          <h5>${displayName}</h5>
          <div>
            <p>${artist}</p>
          </div>
        </div>
        <img id="playbtn" src="/${git_reponame}/svg/play.svg" alt="Play Button">
      </li>`;
  });
}

/**
 * Display songs in the UI from file system data
 */
function displaySongsFromFileSystem(songs) {
  songUL.innerHTML = "";
  
  songs.forEach((song, index) => {
    let songDetail = decodeURI(song).split(".")[0].split(" - ");
    
    if (songDetail.length === 2) {
      songUL.innerHTML += `
        <li>
          <p id='index' hidden>${index}</p>
          <p class="material-symbols-outlined">music_note</p>
          <div class="info">
            <h5>${songDetail[0]}</h5>
            <div>
              <p>${songDetail[1]}</p>
            </div>
          </div>
          <img id="playbtn" src="/${git_reponame}/svg/play.svg" alt="Play Button">
        </li>`;
    } else {
      songUL.innerHTML += `
        <li>
          <p id='index' hidden>${index}</p>
          <p class="material-symbols-outlined">music_note</p>
          <div class="info">
            <h5>${songDetail[0]}</h5>
          </div>
          <img id="playbtn" src="/${git_reponame}/svg/play.svg" alt="Play Button">
        </li>`;
    }
  });
}

/**
 * Get all albums
 */
async function getAlbums() {
  try {
    // Try to use the API first
    try {
      const response = await fetch(`${ENDPOINTS.ALBUMS}`);
      if (!response.ok) {
        showToast('Trying alternative method to load albums...', 'info');
      }
      
      const albums = await response.json();
      
      if (albums && albums.length > 0) {
        // Create cards for each album
        const cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = "";
        
        albums.forEach(album => {
          const folder = album.folderName;
          cardContainer.innerHTML += `
            <div class="card" data-folder="${folder}">
              <img class="cardimage" src="${server_url}/songs/${folder}/cover.jpg" alt="${album.title} cover" onerror="this.src='/${git_reponame}/svg/music-note.svg';">
              <div>
                <h2>${album.title}</h2>
                <p>${album.artist || 'Unknown Artist'}</p>
              </div>
            </div>
          `;
        });
        
        // Add event listeners to cards
        document.querySelectorAll('.card').forEach(card => {
          card.addEventListener('click', handleCardClick);
        });
        
        // Populate featured section
        populateFeaturedSection(albums);
        
        return;
      }
    } catch (apiError) {
      showToast('Trying alternative method to load albums...', 'info');
    }
    
    // Fallback to file system approach
    fallbackGetAlbums();
  } catch (error) {
    showToast('Could not load albums', 'warning');
    
    // Try fallback as last resort
    fallbackGetAlbums();
  }
}

/**
 * Populate featured section with albums
 */
function populateFeaturedSection(albums) {
  try {
    // Get featured container
    const featuredCarousel = document.querySelector('.featured-carousel');
    if (!featuredCarousel) return;
    
    featuredCarousel.innerHTML = '';
    
    // Get up to 5 albums
    const featuredAlbums = albums.slice(0, 5);
    
    // Create featured cards
    featuredAlbums.forEach(album => {
      const folder = album.folderName;
      featuredCarousel.innerHTML += `
        <div class="featured-card" data-folder="${folder}">
          <div class="featured-image">
            <img src="${server_url}/songs/${folder}/cover.jpg" alt="${album.title} cover" onerror="this.src='/${git_reponame}/svg/music-note.svg';">
          </div>
          <div class="featured-info">
            <h3>${album.title}</h3>
            <p>${album.artist || 'Unknown Artist'}</p>
          </div>
          <div class="play-overlay">
            <img src="/${git_reponame}/svg/play.svg" alt="play button" class="play">
          </div>
        </div>
      `;
    });
    
    // Add click event listeners
    document.querySelectorAll('.featured-card').forEach(card => {
      card.addEventListener('click', async () => {
        try {
          const folder = card.dataset.folder;
          if (!folder) {
            showToast('Invalid album folder', 'error');
            return;
          }
          
          await getSongs(`${server_url}/songs/${folder}`);
          
          // Close sidebar on mobile
          if (window.innerWidth <= 768 && hamburger) {
            hamburger.click();
          }
        } catch (error) {
          showToast('Could not load this album', 'error');
        }
      });
    });
  } catch (error) {
    console.warn('Error populating featured section:', error);
  }
}
/**
 * Initialize recently played section
 */
async function initializeRecentlyPlayed() {
  try {
    const recentlyPlayedList = document.querySelector('.recently-played-list');
    if (!recentlyPlayedList) {
      showToast('Recently played list element not found. Due to some technical issues.', 'warning');
      return;
    }
    
    const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    
    if (recentlyPlayed.length === 0) {
      recentlyPlayedList.innerHTML = '<p class="empty-message">No recently played songs</p>';
      return;
    }
    
    // Filter out entries with missing folder or name
    const validEntries = recentlyPlayed.filter(song => song && song.folder && song.name);
    
    if (validEntries.length === 0) {
      recentlyPlayedList.innerHTML = '<p class="empty-message">No recently played songs</p>';
      return;
    }
    
    recentlyPlayedList.innerHTML = validEntries.map(song => `
      <div class="recently-played-item" 
           data-folder="${song.folder}" 
           data-song="${song.name}">
        <img src='${server_url}/songs/${song.folder}/cover.jpg' alt='Album cover' onerror="this.src='/${git_reponame}/svg/music-note.svg';">
        <div class="song-info">
          <h4>${formatSongName(song.name)}</h4>
          <p>${song.folder}</p>
        </div>
        <img src="/${git_reponame}/svg/play.svg" alt="play button" class="play-btn">
      </div>
    `).join('');
    
    // Add click handlers for recently played items
    document.querySelectorAll('.recently-played-item').forEach(item => {
      item.addEventListener('click', async () => {
        try {
          const folder = item.dataset.folder;
          const songName = item.dataset.song;
          
          if (!folder || !songName) {
            showToast('Invalid song information', 'warning');
            return;
          }
          
          // Set currFolder with full path
          currFolder = `${server_url}/songs/${folder}`;
          
          // Try to play the song directly first
          const songPath = `${server_url}/songs/${folder}/${songName}.mp3`;
          
          try {
            // Check if the song exists
            const checkResponse = await fetch(songPath, { method: 'HEAD' });
            
            if (checkResponse.ok) {
              // Song exists, play it directly
              playMusic(songName + '.mp3', false, songPath);
              return;
            }
          } catch (checkError) {
          }
          
          // If direct play failed, use playSongFromSearchBar
          await playSongFromSearchBar(folder, songName);
        } catch (error) {
          showToast('Could not play this song', 'warning');
        }
      });
    });
  } catch (error) {
    showToast('Could not initialize recently played section. Due to some technical issues.', 'warning');
    // Try to reset the recently played list if it's corrupted
    try {
      const recentlyPlayedList = document.querySelector('.recently-played-list');
      if (recentlyPlayedList) {
        recentlyPlayedList.innerHTML = '<p class="empty-message">No recently played songs</p>';
      }
    } catch (resetError) {
      showToast('Could not reset recently played list. Due to some technical issues.', 'warning');
    }
  }
}

/**
 * Add song to recently played list
 */
function addToRecentlyPlayed(songName, folder) {
  try {
    // Skip if songName or folder is missing
    if (!songName || !folder) {
      return;
    }
    
    // If songName is a path, extract the filename
    if (songName && songName.includes('/')) {
      songName = songName.split('/').pop();
    }
    
    // Remove .mp3 extension if present
    if (songName && songName.toLowerCase().endsWith('.mp3')) {
      songName = songName.substring(0, songName.length - 4);
    }
    
    const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    
    // Normalize folder name (remove '/songs/' prefix if present)
    const normalizedFolder = folder.replace(/^\/?songs\//, '').replace(/\/$/, '');
    
    // Remove existing entries with same song and folder
    const filteredList = recentlyPlayed.filter(song => 
      !(song.name === songName && song.folder === normalizedFolder)
    );
    
    // Add new entry to beginning
    filteredList.unshift({ 
      name: songName, 
      folder: normalizedFolder,
      timestamp: Date.now()
    });
    
    // Keep only last 10 items
    const trimmedList = filteredList.slice(0, 10);
    
    localStorage.setItem('recentlyPlayed', JSON.stringify(trimmedList));
    
    // Refresh UI if the function exists
    if (typeof initializeRecentlyPlayed === 'function') {
      initializeRecentlyPlayed();
    }
  } catch (error) {
    console.warn('Error adding to recently played:', error);
    // Don't show toast to avoid disrupting the user experience
  }
}

/**
 * Play a music track
*/
function playMusic(track, pause = false, path = '') {
  try {
    // Handle if track is a song object from API
    if (track && typeof track === 'object' && track.filePath) {
      path = track.filePath;
      track = track.name;
    }
    
    // Set the source of the audio
    if (path) {
      // Make sure path uses the backend URL
      if (!path.startsWith('http')) {
        // If path is relative, convert it to absolute with backend URL
        const folderName = path.split('/')[1]; // Extract folder name from path
        if (folderName) {
          path = `${server_url}/songs/${folderName}/${path.split('/').pop()}`;
        } else {
          // If we can't extract folder, try using currFolder
          const currentFolder = currFolder ? currFolder.split('/').pop() : '';
          if (currentFolder) {
            path = `${server_url}/songs/${currentFolder}/${path.split('/').pop()}`;
          }
        }
      }
      currentSong.src = path;
    } else if (currFolder) {
      // Make sure we're using the backend URL for songs
      const folderName = currFolder.split('/').pop();
      currentSong.src = `${server_url}/songs/${folderName}/${track}`;
    } else {
      showToast("Cannot play song: Missing folder information", "warning");
      return;
    }
    
    // Play or pause based on parameter
    if (!pause) {
      currentSong.play()
        .catch(error => {
          showToast("Unable to play this song. Please try another.", "warning");
          
          // Try an alternative approach
          try {
            // Extract song name and folder from path or track
            let songName = '';
            let folderName = '';
            
            if (path) {
              const pathParts = path.split('/');
              songName = pathParts.pop();
              folderName = pathParts[pathParts.length - 2]; // Get the second-to-last part
            } else if (track) {
              songName = track;
              folderName = currFolder ? currFolder.split('/').pop() : '';
            }
            
            if (songName && folderName) {
              currentSong.src = `${server_url}/songs/${folderName}/${songName}`;
              currentSong.play()
                .catch(altError => {
                  showToast("Unable to play this song. Please try another.", "warning");
                });
            } else {
              showToast("Unable to play this song. Please try another.", "warning");
            }
          } catch (altError) {
            showToast("Unable to play this song. Please try another.", "warning");
          }
        });
    } else {
      currentSong.pause();
    }
    
    // Update UI with song info
    let songName = track ? decodeURI(track) : path.split("/").pop();
    
    // Clean up song name for display
    songName = formatSongName(songName);
    
    document.querySelector(".songinfo").innerHTML = songName;
    document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
    document.querySelector(".current-time").textContent = "00:00";
    document.querySelector(".total-time").textContent = "00:00";
    
    // Update album art with the current song
    const folderName = currFolder ? currFolder.split('/').pop() : '';
    updateAlbumArt(folderName);
    
    // Update play button state
    playBtn.innerHTML = pause ? "play_circle" : "pause";
    
    // Reset like button
    const likeBtn = document.querySelector('.like-btn');
    if (likeBtn) {
      const icon = likeBtn.querySelector('span');
      if (icon) {
        // Check if song is in liked songs
        const likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
        const isLiked = likedSongs.some(song => song.fileName === track);
        
        if (isLiked) {
          icon.textContent = 'favorite';
          icon.style.color = '#1DB954';
        } else {
          icon.textContent = 'favorite_border';
          icon.style.color = '';
        }
      }
    }
    
    // Try to increment play count if we have an ID
    const songElement = document.querySelector(`.song[data-name="${track}"]`);
    if (songElement && songElement.dataset.id) {
      fetch(`${ENDPOINTS.SONGS}/${songElement.dataset.id}/play`, {
        method: 'PUT'
      }).catch(err => console.log("Error incrementing play count:", err));
    }
    
    // Add to recently played
    if (!pause && currFolder) {
      const folderName = currFolder.split('/').pop();
      addToRecentlyPlayed(track, folderName);
    }
    
    // Update queue display if it's open
    const queuePanel = document.querySelector('.queue-panel');
    if (queuePanel && queuePanel.style.display === 'block') {
      updateQueueDisplay();
    }
  } catch (error) {
    showToast("Error playing song. Please try again.", "warning");
  }
}

/**
 * Update album art
*/
function updateAlbumArt(folderName) {
  const albumArt = document.querySelector('.album-art');
  
  if (folderName) {
    albumArt.innerHTML = `<img src="${server_url}/songs/${folderName}/cover.jpg" alt="Album cover" onerror="this.src='/${git_reponame}/svg/music-note.svg';">`;
  }
}
/**
 * Fallback method to get albums using file system
 */
async function fallbackGetAlbums() {
  try {
    // Try to fetch directly from the backend songs folder
    const response = await fetch('${server_url}/songs/');
    
    if (!response.ok) {
      showToast('Could not load albums', 'warning');
      displayEmptyAlbumsList();
      return;
    }
    
    const data = await response.text();
    let div = document.createElement("div");
    div.innerHTML = data;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";
    
    // Process each folder
    let folders = [];
    let albumPromises = [];
    
    for (let index = 0; index < anchors.length; index++) {
      const element = anchors[index];
      // Check if it's a folder (ends with /)
      if (element.href.endsWith('/') && !element.href.endsWith('../')) {
        const folder = element.innerText.replace('/', '');
        folders.push(folder);
        
        // Try to get info.json for each folder
        albumPromises.push(
          fetch(`${server_url}/songs/${folder}/info.json`)
            .then(res => res.ok ? res.json() : { title: folder, artist: 'Unknown Artist' })
            .then(data => ({ folder, data }))
            .catch(() => ({ folder, data: { title: folder, artist: 'Unknown Artist' } }))
        );
      }
    }
    
    // Wait for all album info to be fetched
    const albumsInfo = await Promise.all(albumPromises);
    
    // Create cards for each album
    albumsInfo.forEach(({ folder, data }) => {
      cardContainer.innerHTML += `
        <div class="card" data-folder="${folder}">
          <img class="cardimage" src="${server_url}/songs/${folder}/cover.jpg" alt="${data.title} cover" onerror="this.src='/${git_reponame}/svg/music-note.svg';">
          <div>
            <h2>${data.title}</h2>
            <p>${data.artist || 'Unknown Artist'}</p>
          </div>
        </div>
      `;
    });
    
    // Add event listeners to cards
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', handleCardClick);
    });
    
    // Create featured section with random albums
    const featuredAlbums = albumsInfo
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    
    displayFeaturedPlaylists(featuredAlbums);
  } catch (error) {
    showToast('Could not load albums', 'warning');
    
    // Show empty state
    displayEmptyAlbumsList();
  }
}

/**
 * Display empty albums list
 */
function displayEmptyAlbumsList() {
  let cardContainer = document.querySelector(".cardContainer");
  if (cardContainer) {
    cardContainer.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">album</span>
        <p>No albums found</p>
      </div>
    `;
  }
}

/**
 * Display featured playlists
 */
function displayFeaturedPlaylists(albums) {
  try {
    const featuredCarousel = document.querySelector('.featured-carousel');
    if (!featuredCarousel) return;
    
    featuredCarousel.innerHTML = '';
    
    albums.forEach(album => {
      const folder = album.folder || album.folderName;
      const title = album.data ? album.data.title : album.title;
      const artist = album.data ? (album.data.artist || 'Unknown Artist') : (album.artist || 'Unknown Artist');
      
      featuredCarousel.innerHTML += `
        <div class="featured-card" data-folder="${folder}">
          <div class="featured-image">
            <img src="${server_url}/songs/${folder}/cover.jpg" alt="${title} cover" onerror="this.src='/${git_reponame}/svg/music-note.svg';">
          </div>
          <div class="featured-info">
            <h3>${title}</h3>
            <p>${artist}</p>
          </div>
          <div class="play-overlay">
            <img src="/${git_reponame}/svg/play.svg" alt="play button" class="play">
          </div>
        </div>
      `;
    });
    
    // Add click event listeners
    document.querySelectorAll('.featured-card').forEach(card => {
      card.addEventListener('click', async () => {
        try {
          const folder = card.dataset.folder;
          if (!folder) {
            showToast('Invalid album folder', 'error');
            return;
          }
          
          await getSongs(`${server_url}/songs/${folder}`);
          
          // Close sidebar on mobile
          if (window.innerWidth <= 768 && hamburger) {
            hamburger.click();
          }
        } catch (error) {
          showToast('Could not load this album', 'error');
        }
      });
    });
  } catch (error) {
  }
}

/**
 * Display albums
 */
function displayAlbums(container) {
  // Fetch albums from API
  fetch(`${ENDPOINTS.ALBUMS}`)
    .then(response => {
      if (!response.ok) {
        showToast('Failed to fetch albums', 'error');
      }
      return response.json();
    })
    .then(albums => {
      if (albums.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="material-symbols-outlined">album</span>
            <p>No albums found</p>
          </div>
        `;
      } else {
        container.innerHTML = '';
        
        albums.forEach(album => {
          const albumItem = document.createElement('li');
          albumItem.className = 'album-item';
          albumItem.dataset.folder = album.folderName;
          albumItem.dataset.id = album._id;
          albumItem.innerHTML = `
            <div class="album-info" >
              <h4>${album.title}</h4>
              <p>${album.artist}</p>
            </div>
            <button class="play-album-btn" data-id="${album._id}" data-folder="${album.folderName}">
              <span class="material-symbols-outlined">play_arrow</span>
            </button>
          `;
          
          container.appendChild(albumItem);
        });
        
        // Add event listeners to album items
        container.querySelectorAll('.album-item').forEach(item => {
          item.addEventListener('click', async () => {
            const folder = item.dataset.folder;
            document.querySelector('.filter-btn[data-filter="playlists"]').click();
            await getSongs(`${API_URL}/songs/${folder}`);
          });
        });
      }
    })
    .catch(error => {
      console.error('Error loading albums:', error);
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">error</span>
          <p>Error loading albums</p>
        </div>
      `;
    });
}

/**
 * Display artists
 */
function displayArtists(container) {
  // This is a placeholder for actual implementation
  container.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined">person</span>
      <p>Artists coming soon</p>
    </div>
  `;
}
/**
 * Play album by ID
 */
async function playAlbumById(albumId) {
  try {
    const response = await fetch(`${ENDPOINTS.ALBUMS}/${albumId}`);
    
    if (!response.ok) {
      showToast('Could not load this album', 'warning');
      return;
    }
    
    const album = await response.json();
    
    if (!album) {
      showToast('Could not load this album', 'warning');
      return;
    }
    
    if (!album.songs || album.songs.length === 0) {
      showToast('This album is empty', 'info');
      return;
    }
    
    // Get the folder name
    const folderName = album.folderName;
    if (!folderName) {
      showToast('Could not load this album', 'warning');
      return;
    }
    
    // Load all songs in this album
    await getSongs(`${server_url}/songs/${folderName}`);
    
    // Fetch first song and play it
    try {
      const firstSongResponse = await fetch(`${ENDPOINTS.SONGS}/${album.songs[0]}`);
      
      if (!firstSongResponse.ok) {
        showToast('Trying alternative method to play album...', 'info');
        
        // Try to play the first song from the songs array
        if (songs && songs.length > 0) {
          playMusic(songs[0]);
          showToast(`Playing album: ${album.title}`, 'success');
          return;
        }
        
        showToast('Could not play any songs in this album', 'warning');
        return;
      }
      
      const firstSong = await firstSongResponse.json();
      
      // Construct the file path
      let filePath = '';
      if (firstSong.filePath) {
        filePath = firstSong.filePath;
      } else {
        filePath = `${server_url}/songs/${folderName}/${firstSong.name}.mp3`;
      }
      
      // Play the song
      playMusic({
        name: firstSong.name,
        filePath: filePath
      });
      
      // Show success message
      showToast(`Playing album: ${album.title}`, 'success');
    } catch (songError) {
      showToast('Could not play this song. Song path not found', 'warning');
      
      // Try to play the first song directly from the folder
      if (songs && songs.length > 0) {
        playMusic(songs[0]);
        showToast(`Playing album: ${album.title}`, 'success');
      } else {
        showToast('Could not play this album', 'warning');
      }
    }
  } catch (error) {
    showToast('Could not play this album', 'warning');
  }
}
/**
 * Initialize user authentication
 */
function initializeAuth() {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userDropdown = document.querySelector('.user-dropdown');
  const usernameElement = document.querySelector('.username');
  const loginModal = document.getElementById('login-modal');
  const registerModal = document.getElementById('register-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (token) {
    // User is logged in
    loginBtn.style.display = 'none';
    userDropdown.style.display = 'flex';
    
    // Fetch user data
    fetchUserData(token);
  } else {
    // User is not logged in
    loginBtn.style.display = 'block';
    userDropdown.style.display = 'none';
  }
  
  // Event listeners
  loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
  });
  
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
  
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    registerModal.style.display = 'flex';
  });
  
  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.style.display = 'none';
    loginModal.style.display = 'flex';
  });
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      loginModal.style.display = 'none';
      registerModal.style.display = 'none';
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
      registerModal.style.display = 'none';
    }
  });
  
  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    try {
      // Show loading state
      showToast('Logging in...', 'info');
      
      const response = await fetch(`${ENDPOINTS.USERS}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        
        // Update UI
        loginBtn.style.display = 'none';
        userDropdown.style.display = 'flex';
        usernameElement.textContent = data.name;
        document.querySelector('.filter-btn[data-filter="my-playlists"]').click();
        // Close modal
        loginModal.style.display = 'none';
        
        // Show success message
        showToast('Login successful! Welcome back.', 'success');
        showToast('Redirecting to home page...', 'info');
        showToast("Please use the website without login. Dashboard is under development and will be available soon with too many features and security.", 'info', 10000);
      } else {
        // Show error message with nice styling
        errorElement.textContent = data.message || 'Login failed. Please try again.';
        errorElement.style.display = 'block';
        showToast(data.message || 'Login failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      errorElement.textContent = 'Network error. Please check your connection.';
      errorElement.style.display = 'block';
      showToast('Network error. Please check your connection.', 'error');
    }
  });
  
  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorElement = document.getElementById('register-error');
    
    try {
      // Show loading state
      showToast('Creating your account...', 'info');
      
      const response = await fetch(ENDPOINTS.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        
        // Update UI
        loginBtn.style.display = 'none';
        userDropdown.style.display = 'flex';
        usernameElement.textContent = data.name;
        
        // Close modal
        registerModal.style.display = 'none';
        
        // Show success message
        showToast('Registration successful! Welcome to Tuneflow.', 'success');
      } else {
        // Show error message with nice styling
        errorElement.textContent = data.message || 'Registration failed. Please try again.';
        errorElement.style.display = 'block';
        showToast(data.message || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      errorElement.textContent = 'Network error. Please check your connection.';
      errorElement.style.display = 'block';
      showToast('Network error. Please check your connection.', 'error');
    }
  });
  
  // Check for token in URL (from Google OAuth redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    localStorage.setItem('token', tokenFromUrl);
    // Remove token from URL to prevent sharing
    window.history.replaceState({}, document.title, '/');
    // Refresh page to update UI
    window.location.reload();
  }
}

// Fetch user data
async function fetchUserData(token) {
  try {
    const response = await fetch(`${ENDPOINTS.USERS}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      showToast('Failed to fetch user data', 'error');
    }
    
    const userData = await response.json();
    
    // Update UI with user data
    document.querySelector('.username').textContent = userData.name;
    
    // Update liked songs if available
    if (userData.favorites && userData.favorites.songs) {
      // Update liked songs UI
      updateLikedSongsFromUserData(userData.favorites.songs);
    }
    
    // Update recently played if available
    if (userData.recentlyPlayed) {
      // Update recently played UI
      updateRecentlyPlayedFromUserData(userData.recentlyPlayed);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    // If token is invalid, logout
    if (error.message === 'Failed to fetch user data') {
      logout();
    }
  }
}

// Update liked songs from user data
function updateLikedSongsFromUserData(songIds) {
  // Implementation depends on your UI structure
  // This is a placeholder
  const likedSongsList = document.querySelector('.liked-songs-list');
  if (songIds.length > 0) {
    likedSongsList.innerHTML = '<p>Loading liked songs...</p>';
    
    // Fetch song details for each ID
    Promise.all(songIds.map(id => 
      fetch(`${ENDPOINTS.SONGS}/${id}`).then(res => res.json())
    ))
    .then(songs => {
      if (songs.length > 0) {
        likedSongsList.innerHTML = '';
        songs.forEach(song => {
          const songElement = document.createElement('div');
          songElement.className = 'liked-song-item';
          songElement.innerHTML = `
            <div class="song-info">
              <h4>${song.title}</h4>
              <p>${song.artist}</p>
            </div>
            <div class="song-actions">
              <button class="play-btn" data-id="${song._id}">
                <span class="material-symbols-outlined">play_arrow</span>
              </button>
              <button class="unlike-btn" data-id="${song._id}">
                <span class="material-symbols-outlined">favorite</span>
              </button>
            </div>
          `;
          likedSongsList.appendChild(songElement);
        });
        
        // Add event listeners
        document.querySelectorAll('.play-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const songId = btn.getAttribute('data-id');
            playSongById(songId);
          });
        });
        
        document.querySelectorAll('.unlike-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const songId = btn.getAttribute('data-id');
            removeSongFromFavorites(songId);
          });
        });
      }
    })
    .catch(error => {
      console.error('Error fetching liked songs:', error);
      likedSongsList.innerHTML = '<p>Error loading liked songs</p>';
    });
  } else {
    likedSongsList.innerHTML = '<p class="liked-songs-empty">You haven\'t liked any songs yet.</p>';
  }
}

// Update recently played from user data
function updateRecentlyPlayedFromUserData(recentlyPlayed) {
  // Implementation depends on your UI structure
  // This is a placeholder
  const recentlyPlayedList = document.querySelector('.recently-played-list');
  if (recentlyPlayed.length > 0) {
    recentlyPlayedList.innerHTML = '<p>Loading recently played songs...</p>';
    
    // Get song IDs from recently played
    const songIds = recentlyPlayed.map(item => item.song);
    
    // Fetch song details for each ID
    Promise.all(songIds.map(id => 
      fetch(`${ENDPOINTS.SONGS}/${id}`).then(res => res.json())
    ))
    .then(songs => {
      if (songs.length > 0) {
        recentlyPlayedList.innerHTML = '';
        songs.forEach(song => {
          const songElement = document.createElement('div');
          songElement.className = 'recent-song-item';
          songElement.innerHTML = `
            <div class="song-info">
              <h4>${song.title}</h4>
              <p>${song.artist}</p>
            </div>
            <div class="song-actions">
              <button class="play-btn" data-id="${song._id}">
                <span class="material-symbols-outlined">play_arrow</span>
              </button>
            </div>
          `;
          recentlyPlayedList.appendChild(songElement);
        });
        
        // Add event listeners
        document.querySelectorAll('.play-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const songId = btn.getAttribute('data-id');
            playSongById(songId);
          });
        });
      }
    })
    .catch(error => {
      console.error('Error fetching recently played songs:', error);
      recentlyPlayedList.innerHTML = '<p>Error loading recently played songs</p>';
    });
  } else {
    recentlyPlayedList.innerHTML = '<p>No recently played songs</p>';
  }
}

// Play song by ID
async function playSongById(songId) {
  try {
    const response = await fetch(`${ENDPOINTS.SONGS}/${songId}`);
    
    if (!response.ok) {
      showToast('Could not play this song', 'warning');
      return;
    }
    
    const song = await response.json();
    
    if (!song) {
      showToast('Could not play this song', 'warning');
      return;
    }
    
    // Get the album to find the folder name
    let folderName = '';
    if (song.album && song.album.folderName) {
      folderName = song.album.folderName;
    } else if (song.album) {
      // Fetch album details if folderName is not included
      try {
        const albumResponse = await fetch(`${ENDPOINTS.ALBUMS}/${song.album}`);
        if (albumResponse.ok) {
          const album = await albumResponse.json();
          folderName = album.folderName;
        }
      } catch (albumError) {
        console.warn('Error fetching album details:', albumError);
      }
    }
    
    // Add to recently played if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${ENDPOINTS.USERS}/recently-played/${songId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => console.log('Error adding to recently played:', err));
    }
    
    // Construct the file path
    let filePath = '';
    if (song.filePath) {
      filePath = song.filePath;
    } else if (folderName) {
      filePath = `${server_url}/songs/${folderName}/${song.name}.mp3`;
    } else {
      showToast('Could not play this song', 'warning');
      return;
    }
    
    // Play the song
    playMusic({
      name: song.name,
      filePath: filePath
    });
    
    // Show success message
    showToast(`Playing: ${formatSongName(song.name)}`, 'success');
    
    // Try to load all songs in this album
    if (folderName) {
      await getSongs(`${server_url}/songs/${folderName}`);
    }
  } catch (error) {
    showToast('Could not play this song', 'warning');
  }
}

// Add song to favorites
async function addSongToFavorites(songId) {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Please login to add songs to favorites', 'warning');
    return;
  }
  
  try {
    const response = await fetch(`${ENDPOINTS.USERS}/favorites/songs/${songId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      showToast('Could not add song to favorites', 'warning');
      return;
    }
    
    showToast('Added to your Liked Songs', 'success');
  } catch (error) {
    showToast('Could not add song to favorites', 'warning');
  }
}

// Remove song from favorites
async function removeSongFromFavorites(songId) {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Please login to remove songs from favorites', 'warning');
    return;
  }
  
  try {
    const response = await fetch(`${ENDPOINTS.USERS}/favorites/songs/${songId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      showToast('Could not remove song from favorites', 'warning');
      return;
    }
    
    showToast('Removed from your Liked Songs', 'success');
  } catch (error) {
    showToast('Could not remove song from favorites', 'warning');
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  document.getElementById('login-btn').style.display = 'block';
  document.querySelector('.user-dropdown').style.display = 'none';
  showToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = '/'
  }, 1000);
}

/**
 * Toggle queue panel
 */
function toggleQueuePanel() {
  const queuePanel = document.querySelector('.queue-panel');
  
  if (queuePanel.style.display === 'none' || !queuePanel.style.display) {
    // Show queue panel
    queuePanel.style.display = 'block';
    updateQueueDisplay();
  } else {
    // Hide queue panel
    queuePanel.style.display = 'none';
  }
}

/**
 * Update queue display
 */
function updateQueueDisplay() {
  const nowPlayingItem = document.querySelector('.now-playing-item .queue-song');
  const queueList = document.querySelector('.queue-list');
  const queueEmpty = document.querySelector('.queue-empty');
  
  // Update now playing
  if (currentSong.src) {
    const songName = formatSongName(decodeURI(currentSong.src.split('/').pop()));
    nowPlayingItem.innerHTML = `
      <div class="queue-song-info">
        <p class="queue-song-name">${songName}</p>
      </div>
    `;
  }
  
  // Update queue
  if (songs.length > 0) {
    queueEmpty.style.display = 'none';
    queueList.innerHTML = '';
    
    // Find current song index
    const currentSongName = decodeURI(currentSong.src.split('/').pop());
    const currentIndex = songs.findIndex(song => decodeURI(song) === currentSongName);
    
    // Show next songs in queue
    if (currentIndex !== -1) {
      const nextSongs = songs.slice(currentIndex + 1);
      
      if (nextSongs.length > 0) {
        nextSongs.forEach((song, index) => {
          const songName = formatSongName(decodeURI(song));
          queueList.innerHTML += `
            <div class="queue-song" data-index="${currentIndex + 1 + index}">
              <div class="queue-song-info">
                <p class="queue-song-name">${songName}</p>
              </div>
              <div class="queue-song-actions">
                <button class="play-queue-song">
                  <span class="material-symbols-outlined">play_arrow</span>
                </button>
              </div>
            </div>
          `;
        });
        
        // Add event listeners to play buttons
        document.querySelectorAll('.play-queue-song').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const songIndex = parseInt(e.target.closest('.queue-song').dataset.index);
            playMusic(songs[songIndex]);
            updateQueueDisplay();
          });
        });
      } else {
        queueEmpty.style.display = 'block';
      }
    } else {
      queueEmpty.style.display = 'block';
    }
  }
}
window.onload = () => {
  initializeTheme();
  setupEventListeners();
  setupViewOptions();
  setupFilterButtons();
  setupSeekbarControls();
  initializeRecentlyPlayed();
}