// src/utils/auth.js

// src/utils/auth.js

export const getUser = () => {
  const user = localStorage.getItem("user");
  if (!user) return null;

  const parsedUser = JSON.parse(user);

  // Normalize role to uppercase (case-insensitive handling)
  return {
    ...parsedUser,
    role: parsedUser.role?.toUpperCase()
  };
};


export const logout = () => {
  localStorage.removeItem("user");
};
