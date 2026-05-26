{
  adminItems.map((item) => (
    <li key={item.name}>
      <NavLink
        to={item.to}
        className={({ isActive }) => 
          `flex items-center px-4 py-2 mt-2 text-gray-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors ${
            isActive ? "bg-indigo-100 text-indigo-700" : ""
          }`
        }
      >
        {item.icon}
        <span className="mx-4 font-medium">{item.name}</span>
      </NavLink>
    </li>
  ))
} 