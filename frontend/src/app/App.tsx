"use client";
import React from "react";
import Link from "next/link";

const App: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the App</h1>
      <Link href="/login" passHref>
        <button type="button">Login</button>
      </Link>
      <Link href="/register" passHref>
        <button type="button">Register</button>
      </Link>
    </div>
  );
};

export default App;