import { User } from 'firebase/auth';

// Add this inside your useAuth hook or login component
const syncUser = async (firebaseUser: User) => {
  const token = await firebaseUser.getIdToken();
  const res = await fetch('/api/auth/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      picture: firebaseUser.photoURL
    })
  });
  const data = await res.json();
  // Save MongoDB User Data to State/Storage
  localStorage.setItem('mongoUser', JSON.stringify(data.user));
}