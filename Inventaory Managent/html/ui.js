// UI management for the inventory system
const uiManager = {
  cart: JSON.parse(localStorage.getItem("cart")) || [],
  cartTimer: null,
  wishlist: JSON.parse(localStorage.getItem("wishlist")) || [],

  // Show selected page and hide others
  showPage(pageId) {
    const pages = document.querySelectorAll(".page-content");
    const selectedPage = document.getElementById(pageId);

    if (!selectedPage) return;

    pages.forEach((page) => {
      if (page !== selectedPage) {
        page.classList.add("hidden");
      }
    });

    selectedPage.classList.remove("hidden");

    switch (pageId) {
      case "dashboard":
        this.updateDashboard();
        this.updateInventoryStats();
        break;
      case "inventory":
        this.displayProducts(JSON.parse(localStorage.getItem("products")) || []);
        this.updateInventoryStats();
        break;
      case "shop":
        this.displayProducts(JSON.parse(localStorage.getItem("products")) || []);
        this.updateShopStats();
        break;
      case "profit-loss":
        this.updateProfitLoss();
        break;
      case "wishlist":
        this.showWishlist();
        break;
    }

    this.updateCartBadge();
    this.updateCart();
    document.title = `${pageId.charAt(0).toUpperCase() + pageId.slice(1)} - Inventory Management`;
    localStorage.setItem("currentPage", pageId);
  },

  // Navigate to page
  navigateTo(page) {
    this.closeCart();
    this.showPage(page);
    const products = JSON.parse(localStorage.getItem("products")) || [];
    this.displayProducts(products);
    this.updateDashboard();
    this.updateCart();
    this.updateCartBadge();
  },

  // Toggle cart sidebar
  toggleCart() {
    const sidebar = document.getElementById("cartSidebar");
    if (sidebar) {
      sidebar.classList.toggle("translate-x-full");
    }
  },

  // Show cart
  showCart() {
    const sidebar = document.getElementById("cartSidebar");
    if (sidebar) {
      sidebar.classList.remove("translate-x-full");
    }
  },

  // Close cart
  closeCart() {
    const sidebar = document.getElementById("cartSidebar");
    if (sidebar) {
      sidebar.classList.add("translate-x-full");
    }
  },

  // Initialize the application
  initialize() {
    this.showLoadingState();
    this.initializeProducts();
    this.wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (!localStorage.getItem("salesHistory")) {
      localStorage.setItem("salesHistory", JSON.stringify([]));
    }

    // Initialize category dropdowns
    const categoryDropdowns = document.querySelectorAll('select[id$="Category"]');
    categoryDropdowns.forEach(dropdown => {
      dropdown.innerHTML = `
        <option value="all">All Categories</option>
        <option value="Groceries">Groceries</option>
      `;
    });

    this.showPage("dashboard");
    this.updateCart();
    this.initializeSearch();
    this.hideLoadingState();
  },

  // Show loading state
  showLoadingState() {
    const loader = document.createElement("div");
    loader.id = "globalLoader";
    loader.className = "fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center";
    loader.innerHTML = `
            <div class="text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                <p class="mt-4 text-gray-600">Loading...</p>
            </div>
        `;
    document.body.appendChild(loader);
  },

  // Hide loading state
  hideLoadingState() {
    const loader = document.getElementById("globalLoader");
    if (loader) {
      loader.classList.add("opacity-0");
      setTimeout(() => loader.remove(), 300);
    }
  },

  // Initialize search functionality
  initializeSearch() {
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        if (e.target.value.trim()) {
          this.searchProducts(e.target.value);
        } else {
          const products = JSON.parse(localStorage.getItem("products")) || [];
          this.displayProducts(products);
        }
      });
    }

    if (categoryFilter) {
      // Add Groceries category
      categoryFilter.innerHTML = `
        <option value="all">All Categories</option>
        <option value="Groceries">Groceries</option>
      `;
      
      categoryFilter.addEventListener("change", () => {
        this.filterProducts();
      });
    }
  },

  // Search products
  searchProducts(query) {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const searchQuery = query.toLowerCase().trim();
    const category = document.getElementById("categoryFilter")?.value || "all";

    if (!searchQuery) return;

    let filteredProducts = products;

    if (category !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === category
      );
    }

    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery)
    );

    this.displayProducts(filteredProducts);
  },

  // Filter products
  filterProducts() {
    const category = document.getElementById("categoryFilter")?.value || "all";
    const searchQuery = document.getElementById("searchInput")?.value || "";
    
    if (searchQuery) {
      this.searchProducts(searchQuery);
    } else {
    const products = JSON.parse(localStorage.getItem("products")) || [];
      if (category === "all") {
        this.displayProducts(products);
      } else {
        const filteredProducts = products.filter(
          (product) => product.category === category
        );
        this.displayProducts(filteredProducts);
      }
    }
  },

  // Display products in the grid
  displayProducts(products) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    grid.classList.add("opacity-0");

    setTimeout(() => {
      grid.innerHTML = '';

      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden product-card aspect-square flex flex-col w-64 h-64';
        card.innerHTML = `
          <div class="relative h-2/5">
            <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
            <button onclick="uiManager.toggleWishlist(${product.id})" class="absolute top-2 right-2 text-gray-500 hover:text-red-500">
              <i class="fas fa-heart ${this.wishlist.includes(product.id) ? 'text-red-500' : ''}"></i>
            </button>
          </div>
          <div class="p-2 flex-1 flex flex-col">
            <h3 class="text-base font-semibold text-gray-800 mb-1 line-clamp-1">${product.name}</h3>
            <p class="text-sm text-gray-600 mb-1">${product.category}</p>
            <div class="mt-auto">
              <div class="flex justify-between items-center mb-1">
                <span class="text-lg font-bold text-indigo-600">₹${product.price.toFixed(2)}</span>
                <span class="text-sm ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}">
                  ${product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <button onclick="uiManager.addToCart(${product.id})" 
                      class="w-full bg-indigo-600 text-white py-1.5 px-2 rounded hover:bg-indigo-700 transition-colors text-sm"
                      ${product.quantity === 0 ? 'disabled' : ''}>
                Add to Cart
              </button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });

      grid.classList.remove("opacity-0");
    }, 300);
  },

  // Initialize products with sample data
  initializeProducts() {
    const storedProducts = JSON.parse(localStorage.getItem("products")) || [];
    if (storedProducts.length === 0 && !localStorage.getItem("productsReset")) {
      const sampleProducts = [
      ];
      sampleProducts.forEach((product) => {
        product.cost = product.price * 0.6;
        product.totalCost = 0;
      });
      localStorage.setItem("products", JSON.stringify(sampleProducts));
      return sampleProducts;
    }
    return storedProducts;
  },

  // Update inventory stats
  updateInventoryStats() {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    
    // Update dashboard stats
    const totalProducts = document.getElementById("totalProducts");
    const totalValue = document.getElementById("totalInventoryValue");
    const totalCategories = document.getElementById("totalCategories");

    // Update inventory page stats
    const totalProductsInv = document.getElementById("totalProductsInv");
    const totalValueInv = document.getElementById("totalInventoryValueInv");
    const totalCategoriesInv = document.getElementById("totalCategoriesInv");

    // Calculate values
    const totalValueAmount = products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const categoriesCount = new Set(products.map((item) => item.category)).size;

    // Update dashboard elements
    if (totalProducts) totalProducts.textContent = products.length;
    if (totalValue) totalValue.textContent = `₹${totalValueAmount.toFixed(2)}`;
    if (totalCategories) totalCategories.textContent = categoriesCount;

    // Update inventory page elements
    if (totalProductsInv) totalProductsInv.textContent = products.length;
    if (totalValueInv) totalValueInv.textContent = `₹${totalValueAmount.toFixed(2)}`;
    if (totalCategoriesInv) totalCategoriesInv.textContent = categoriesCount;
  },

  // Update shop stats
  updateShopStats() {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const totalProducts = document.getElementById("totalShopProducts");
    const availableProducts = document.getElementById("availableProducts");
    const totalCategories = document.getElementById("totalCategories");

    if (totalProducts) totalProducts.textContent = products.length;
    if (availableProducts) {
      const available = products.filter((item) => item.quantity > 0).length;
      availableProducts.textContent = available;
    }
    if (totalCategories) {
      const categories = new Set(products.map((item) => item.category));
      totalCategories.textContent = categories.size;
    }
  },

  // Toggle wishlist
  toggleWishlist(productId) {
    const index = this.wishlist.indexOf(productId);
    if (index === -1) {
      this.wishlist.push(productId);
      this.showNotification("Added to wishlist!", "success");
    } else {
      this.wishlist.splice(index, 1);
      this.showNotification("Removed from wishlist!", "info");
    }
    localStorage.setItem("wishlist", JSON.stringify(this.wishlist));
    this.displayProducts(JSON.parse(localStorage.getItem("products")) || []);
  },

  // Show wishlist
  showWishlist() {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const wishlistProducts = products.filter((product) =>
      this.wishlist.includes(product.id)
    );
    this.displayProducts(wishlistProducts);
  },

  // Apply discount code
  applyDiscount(code) {
    const discountCodes = {
      WELCOME10: 0.1, // 10% off
      SAVE20: 0.2, // 20% off
      SPECIAL30: 0.3, // 30% off
    };

    const discount = discountCodes[code];
    if (discount) {
      const cartSubtotal = document.getElementById("cartSubtotal");
      const cartTotal = document.getElementById("cartTotal");
      const subtotal = parseFloat(cartSubtotal.textContent.replace("₹", ""));
      const discountedTotal = subtotal * (1 - discount);

      cartTotal.textContent = `₹${discountedTotal.toFixed(2)}`;
      this.showNotification(
        `Discount applied! ${discount * 100}% off`,
        "success"
      );
    } else {
      this.showNotification("Invalid discount code!", "error");
    }
  },

  // Add to cart with enhanced animation and profit tracking
  addToCart(productId) {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const product = products.find((p) => p.id === productId);

    if (!product) {
      this.showNotification("Product not found!", "error");
      return;
    }

    if (product.quantity <= 0) {
      this.showNotification("Product is out of stock!", "error");
      return;
    }

    // Create flying cart animation
    const button = event.target;
    const rect = button.getBoundingClientRect();
    const flyingCart = document.createElement("div");
    flyingCart.className = "fixed z-50 pointer-events-none";
    flyingCart.innerHTML = `
            <div class="bg-indigo-600 text-white rounded-full p-2 transform transition-all duration-500">
                <i class="fas fa-shopping-cart"></i>
            </div>
        `;
    flyingCart.style.left = `${rect.left}px`;
    flyingCart.style.top = `${rect.top}px`;
    document.body.appendChild(flyingCart);

    // Animate to cart
    const cartButton = document.querySelector("[data-cart-button]");
    if (cartButton) {
      const cartRect = cartButton.getBoundingClientRect();
      flyingCart.style.transform = `translate(${cartRect.left - rect.left}px, ${
        cartRect.top - rect.top
      }px) scale(0.5)`;
      flyingCart.style.opacity = "0";
    }

    // Initialize cart if it doesn't exist
    if (!this.cart) {
      this.cart = [];
    }

    // Check if product is already in cart
    const existingItem = this.cart.find((item) => item.id === productId);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        this.showNotification("Maximum available quantity reached!", "error");
        return;
      }
      existingItem.quantity += 1;
    } else {
      // Add new item to cart
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        category: product.category,
        cost: product.cost || product.price * 0.6, // Store cost for profit calculation
      });
    }

    // Save cart to localStorage
    localStorage.setItem("cart", JSON.stringify(this.cart));

    // Update cart display
    this.updateCart();

    // Show cart
    this.showCart();

    // Show success notification
    this.showNotification("Product added to cart!", "success");

    // Remove flying cart after animation
    setTimeout(() => flyingCart.remove(), 500);

    // Animate cart badge
    this.updateCartBadge();

    // Update profit/loss preview
    this.updateProfitLossPreview();
  },

  // Update profit/loss preview in cart
  updateProfitLossPreview() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    const cartSummary = document.getElementById("cartSummary");
    if (!cartSummary) return;

    // Calculate potential sale details
    const subtotal = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.02; // 2% tax
    const total = subtotal + tax;
    const totalCost = this.cart.reduce(
      (sum, item) => sum + item.cost * item.quantity,
      0
    );
    const potentialProfit = subtotal - totalCost;
    const profitMargin = subtotal > 0 ? (potentialProfit / subtotal) * 100 : 0;

    // Update cart summary with profit preview
    cartSummary.innerHTML = `
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 class="text-sm font-medium text-gray-900 mb-2">Cart Summary</h3>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Items (${this.cart.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )})</span>
                        <span class="text-gray-900">₹${subtotal.toFixed(
                          2
                        )}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Tax (2%)</span>
                        <span class="text-gray-900">₹${tax.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Shipping</span>
                        <span class="text-gray-900">Free</span>
                    </div>
                    <div class="border-t pt-2 mt-2">
                        <div class="flex justify-between font-medium">
                            <span class="text-gray-900">Total</span>
                            <span class="text-gray-900">₹${total.toFixed(
                              2
                            )}</span>
                        </div>
                    </div>
                    <div class="border-t pt-2 mt-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Potential Profit</span>
                            <span class="${
                              potentialProfit >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }">
                                ₹${potentialProfit.toFixed(2)}
                            </span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Profit Margin</span>
                            <span class="${
                              profitMargin >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }">
                                ${profitMargin.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
  },

  // Handle checkout with enhanced profit tracking
  checkout() {
    if (this.cart.length === 0) {
      this.showNotification("Your cart is empty!", "error");
      return;
    }

    // Close cart
    this.closeCart();

    // Check if all items are in stock
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const outOfStockItems = this.cart.filter((cartItem) => {
      const product = products.find((p) => p.id === cartItem.id);
      return !product || product.quantity < cartItem.quantity;
    });

    if (outOfStockItems.length > 0) {
      this.showNotification("Some items are out of stock!", "error");
      return;
    }

    // Calculate sale details
    const saleDetails = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: this.cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        total: item.price * item.quantity,
        profit: (item.price - item.cost) * item.quantity,
      })),
      subtotal: this.cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      tax:
        this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) *
        0.02,
      total:
        this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) *
        1.02,
      totalCost: this.cart.reduce(
        (sum, item) => sum + item.cost * item.quantity,
        0
      ),
      totalProfit: this.cart.reduce(
        (sum, item) => sum + (item.price - item.cost) * item.quantity,
        0
      ),
    };

    // Save sale to history
    const salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
    salesHistory.push(saleDetails);
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));

    // Update inventory quantities and track costs
    this.cart.forEach((cartItem) => {
      const product = products.find((p) => p.id === cartItem.id);
      if (product) {
        // Update quantity
        product.quantity -= cartItem.quantity;

        // Initialize tracking properties if they don't exist
        product.totalCost = product.totalCost || 0;
        product.totalSales = product.totalSales || 0;
        product.totalProfit = product.totalProfit || 0;

        // Update tracking data
        const itemCost = cartItem.cost * cartItem.quantity;
        const itemRevenue = cartItem.price * cartItem.quantity;
        const itemProfit = itemRevenue - itemCost;

        product.totalCost += itemCost;
        product.totalSales += itemRevenue;
        product.totalProfit += itemProfit;
      }
    });

    // Save updated products
    localStorage.setItem("products", JSON.stringify(products));

    // Clear cart
    this.cart = [];
    localStorage.removeItem("cart");

    // Update all displays
    this.updateCart();
    this.updateCartBadge();
    this.displayProducts(products);
    this.updateDashboard();
    this.updateInventoryStats();
    this.updateShopStats();
    this.updateProfitLoss();
    this.toggleCart();

    // Show success notification with profit details
    this.showNotification(
      `Sale completed! Profit: ₹${saleDetails.totalProfit.toFixed(2)}`,
      "success"
    );

    // Trigger real-time update event
    this.triggerRealTimeUpdate();
  },

  // Add new method for real-time updates
  triggerRealTimeUpdate() {
    // Create and dispatch a custom event
    const event = new CustomEvent("inventoryUpdate", {
      detail: {
        timestamp: new Date().toISOString(),
        type: "checkout",
      },
    });
    window.dispatchEvent(event);
  },

  // Update profit/loss page with enhanced analytics
  updateProfitLoss() {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const salesHistory = JSON.parse(localStorage.getItem("salesHistory")) || [];
    const profitLossContent = document.getElementById("profit-loss");
    if (!profitLossContent) return;

    // Calculate overall statistics
    const totalRevenue = salesHistory.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const totalCost = salesHistory.reduce(
      (sum, sale) => sum + sale.totalCost,
      0
    );
    const totalProfit = totalRevenue - totalCost;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Update overall statistics in the UI
    document.getElementById(
      "totalRevenue"
    ).textContent = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById("totalCost").textContent = `₹${totalCost.toFixed(
      2
    )}`;
    document.getElementById(
      "totalProfit"
    ).textContent = `₹${totalProfit.toFixed(2)}`;
    document.getElementById(
      "profitMargin"
    ).textContent = `${profitMargin.toFixed(1)}%`;

    // Calculate category-wise statistics
    const categoryStats = {};
    products.forEach((product) => {
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = {
          revenue: product.totalSales || 0,
          cost: product.totalCost || 0,
          profit: product.totalProfit || 0,
          items: 1,
          stockValue: product.price * product.quantity,
        };
      } else {
        categoryStats[product.category].revenue += product.totalSales || 0;
        categoryStats[product.category].cost += product.totalCost || 0;
        categoryStats[product.category].profit += product.totalProfit || 0;
        categoryStats[product.category].items++;
        categoryStats[product.category].stockValue +=
          product.price * product.quantity;
      }
    });

    // Calculate profits and margins for each category
    Object.keys(categoryStats).forEach((category) => {
      const stats = categoryStats[category];
      stats.margin =
        stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
    });

    // Update category analysis table
    const categoryTableBody = document.getElementById(
      "categoryAnalysisTableBody"
    );
    if (categoryTableBody) {
      categoryTableBody.innerHTML = Object.entries(categoryStats)
        .map(
          ([category, stats]) => `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${category}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                      stats.items
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${stats.revenue.toFixed(
                      2
                    )}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${stats.cost.toFixed(
                      2
                    )}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${
                      stats.profit >= 0 ? "text-green-600" : "text-red-600"
                    }">
                        ₹${stats.profit.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${
                      stats.margin >= 0 ? "text-green-600" : "text-red-600"
                    }">
                        ${stats.margin.toFixed(1)}%
                    </td>
                </tr>
            `
        )
        .join("");
    }

    // Update item-wise profit/loss table
    const profitLossTableBody = document.getElementById("profitLossTableBody");
    if (profitLossTableBody) {
      profitLossTableBody.innerHTML = products
        .map((product) => {
          const itemProfit = product.totalSales - product.totalCost;
          const itemMargin =
            product.totalSales > 0
              ? (itemProfit / product.totalSales) * 100
              : 0;

          return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                    <img class="h-10 w-10 rounded-full object-cover" src="${
                                      product.image
                                    }" alt="${product.name}">
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${
                                      product.name
                                    }</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                          product.category
                        }</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                          product.quantity
                        }</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${(
                          product.totalCost || 0
                        ).toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${(
                          product.totalSales || 0
                        ).toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${
                          itemProfit >= 0 ? "text-green-600" : "text-red-600"
                        }">
                            ₹${itemProfit.toFixed(2)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${
                          itemMargin >= 0 ? "text-green-600" : "text-red-600"
                        }">
                            ${itemMargin.toFixed(1)}%
                        </td>
                    </tr>
                `;
        })
        .join("");
    }

    // Update recent sales table
    const recentSalesTable = document.querySelector(
      "#profit-loss table:last-child tbody"
    );
    if (recentSalesTable) {
      recentSalesTable.innerHTML = salesHistory
        .slice(-5)
        .reverse()
        .map(
          (sale) => `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${new Date(sale.date).toLocaleString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${sale.items.length} items
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹${sale.subtotal.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹${sale.tax.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹${sale.total.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${
                      sale.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                    }">
                        ₹${sale.totalProfit.toFixed(2)}
                    </td>
                </tr>
            `
        )
        .join("");
    }
  },

  // Clear all profit/loss data
  clearProfitLoss() {
    if (
      confirm(
        "Are you sure you want to clear all profit/loss data? This action cannot be undone."
      )
    ) {
      // Clear sales history
      localStorage.setItem("salesHistory", JSON.stringify([]));

      // Reset product tracking data
      const products = JSON.parse(localStorage.getItem("products")) || [];
      products.forEach((product) => {
        product.totalCost = 0;
        product.totalSales = 0;
        product.totalProfit = 0;
      });
      localStorage.setItem("products", JSON.stringify(products));

      // Update the display
      this.updateProfitLoss();

      // Show success notification
      this.showNotification(
        "All profit/loss data has been cleared!",
        "success"
      );
    }
  },

  // Update cart item quantity
  updateCartItemQuantity(productId, change) {
    const cartItem = this.cart.find((item) => item.id === productId);
    if (cartItem) {
      const newQuantity = cartItem.quantity + change;
      const product = JSON.parse(localStorage.getItem("products")).find(
        (p) => p.id === productId
      );

      if (newQuantity <= 0) {
        this.removeFromCart(productId);
        return;
      }

      if (newQuantity > product.quantity) {
        this.showNotification("Maximum available quantity reached!", "error");
        return;
      }

      // Update quantity with animation
      const quantityDisplay = document.querySelector(
        `.quantity-display[data-product-id="${productId}"]`
      );
      if (quantityDisplay) {
        quantityDisplay.classList.add("quantity-change");
        setTimeout(
          () => quantityDisplay.classList.remove("quantity-change"),
          300
        );
      }

      cartItem.quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(this.cart));

      // Update item total with animation
      const itemTotal = document.querySelector(
        `.item-total[data-product-id="${productId}"]`
      );
      if (itemTotal) {
        const newTotal = cartItem.price * newQuantity;
        this.animatePriceChange(itemTotal, newTotal);
      }

      this.updateCart();
    }
  },

  // Remove from cart with animation
  removeFromCart(productId) {
    const cartItemElement = document.querySelector(
      `[data-product-id="${productId}"]`
    );
    if (cartItemElement) {
      const cartItem = cartItemElement.closest(".flex");
      if (cartItem) {
        cartItem.classList.add("removing");
        setTimeout(() => {
          this.cart = this.cart.filter((item) => item.id !== productId);
          localStorage.setItem("cart", JSON.stringify(this.cart));
          this.updateCart();
          this.updateCartBadge();
          this.showNotification("Product removed from cart!", "info");
        }, 300);
        return;
      }
    }
    // If no animation (item not found in DOM), still update cart and badge
    this.cart = this.cart.filter((item) => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(this.cart));
    this.updateCart();
    this.updateCartBadge();
    this.showNotification("Product removed from cart!", "info");
  },

  // Update cart display
  updateCart() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    // Add fade animation to cart items
    cartItems.classList.add("opacity-0");

    setTimeout(() => {
      // Clear existing items
      cartItems.innerHTML = "";

      let subtotal = 0;
      let itemCount = 0;

      // Ensure cart exists
      if (!this.cart) {
        this.cart = JSON.parse(localStorage.getItem("cart")) || [];
      }

      // Create main cart container
      const cartContainer = document.createElement("div");
      cartContainer.className = "flex flex-col h-full";

      // Create scrollable items container
      const itemsContainer = document.createElement("div");
      itemsContainer.className = "flex-1 overflow-y-auto pb-48"; // Add padding to account for fixed bottom section

      // Show empty cart state if cart is empty
      if (this.cart.length === 0) {
        itemsContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div class="relative w-48 h-48 mb-4">
                            <img src="https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" 
                                alt="Empty Cart" 
                                class="w-full h-full object-cover rounded-lg opacity-30">
                            <div class="absolute inset-0 flex items-center justify-center">
                                <i class="fas fa-shopping-cart text-6xl text-gray-400"></i>
                            </div>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                        <p class="text-sm text-gray-500 mb-4">Looks like you haven't added any items to your cart yet.</p>
                        <button onclick="uiManager.navigateTo('shop')" 
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <i class="fas fa-shopping-bag mr-2"></i>
                            Start Shopping
                        </button>
                    </div>
                `;
      } else {
        // Update cart items with enhanced interactivity
        this.cart.forEach((item) => {
          const itemTotal = item.price * item.quantity;
          subtotal += itemTotal;
          itemCount += item.quantity;

          const cartItem = document.createElement("div");
          cartItem.className =
            "flex items-center justify-between py-4 border-b border-gray-200 last:border-0 transform transition-all duration-300 hover:bg-gray-50";
          cartItem.innerHTML = `
                        <div class="flex items-center space-x-4">
                            <img src="${item.image}" alt="${
            item.name
          }" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-medium text-gray-900 truncate">${
                                  item.name
                                }</h4>
                                <p class="text-sm text-gray-500">₹${item.price.toFixed(
                                  2
                                )}</p>
                                <div class="flex items-center space-x-2 mt-2">
                                    <button onclick="uiManager.updateCartItemQuantity(${
                                      item.id
                                    }, -1)" 
                                        class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 transition-colors duration-200">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="text-sm font-medium w-8 text-center quantity-display" data-product-id="${
                                      item.id
                                    }">${item.quantity}</span>
                                    <button onclick="uiManager.updateCartItemQuantity(${
                                      item.id
                                    }, 1)" 
                                        class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 transition-colors duration-200">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col items-end space-y-2">
                            <p class="text-sm font-medium text-gray-900 item-total" data-product-id="${
                              item.id
                            }">₹${itemTotal.toFixed(2)}</p>
                            <button onclick="uiManager.removeFromCart(${
                              item.id
                            })" 
                                class="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-full p-1 transition-colors duration-200">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
          itemsContainer.appendChild(cartItem);
        });
      }

      // Create fixed bottom section
      const bottomSection = document.createElement("div");
      bottomSection.className =
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg";

      if (this.cart.length > 0) {
        bottomSection.innerHTML = `
                    <div class="max-w-7xl mx-auto">
                        <div class="bg-gray-50 rounded-lg p-4 mb-4">
                            <div class="space-y-3">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Subtotal (${itemCount} items)</span>
                                    <span class="text-gray-900 font-medium">₹${subtotal.toFixed(
                                      2
                                    )}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Tax (2%)</span>
                                    <span class="text-gray-900 font-medium">₹${(
                                      subtotal * 0.02
                                    ).toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">Shipping</span>
                                    <span class="text-gray-900 font-medium">Free</span>
                                </div>
                                <div class="border-t pt-3 mt-3">
                                    <div class="flex justify-between">
                                        <span class="text-gray-900 font-semibold">Total Amount</span>
                                        <span class="text-gray-900 font-semibold">₹${(
                                          subtotal * 1.02
                                        ).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onclick="uiManager.checkout()" 
                            class="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center justify-center">
                            <i class="fas fa-lock mr-2"></i>
                            Complete Order
                        </button>
                    </div>
                `;
      }

      // Assemble the cart
      cartContainer.appendChild(itemsContainer);
      cartContainer.appendChild(bottomSection);
      cartItems.appendChild(cartContainer);

      // Fade in cart items
      cartItems.classList.remove("opacity-0");
    }, 300);
  },

  // Animate price changes
  animatePriceChange(element, newValue) {
    if (!element) return;

    const oldValue = parseFloat(element.textContent.replace("₹", "")) || 0;
    const difference = newValue - oldValue;

    // Add animation class
    element.classList.add("price-change");

    // Update the value
    element.textContent = `₹${newValue.toFixed(2)}`;

    // Add color transition based on change
    if (difference > 0) {
      element.classList.add("text-green-600");
    } else if (difference < 0) {
      element.classList.add("text-red-600");
    }

    // Remove animation classes after animation completes
    setTimeout(() => {
      element.classList.remove(
        "price-change",
        "text-green-600",
        "text-red-600"
      );
    }, 1000);
  },

  // Update cart badge
  updateCartBadge() {
    const cartBadge = document.getElementById("cartBadge");
    const cartBadgeMobile = document.getElementById("cartBadgeMobile");

    // Ensure cart exists
    if (!this.cart) {
      this.cart = JSON.parse(localStorage.getItem("cart")) || [];
    }

    const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartBadge) {
      cartBadge.textContent = itemCount;
      cartBadge.classList.toggle("hidden", itemCount === 0);
    }

    if (cartBadgeMobile) {
      cartBadgeMobile.textContent = itemCount;
      cartBadgeMobile.classList.toggle("hidden", itemCount === 0);
    }
  },

  // Clear cart
  clearCart() {
    if (confirm("Are you sure you want to clear your cart?")) {
      this.cart = [];
      localStorage.removeItem("cart");
      this.updateCart();
      this.showNotification("Cart cleared!", "info");
    }
  },

  // Show notification with enhanced animation
  showNotification(message, type = "success") {
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      warning: "bg-yellow-500",
    };

    const notification = document.createElement("div");
    notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 translate-y-full opacity-0 z-50`;
    notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                  type === "success"
                    ? "fa-check-circle"
                    : type === "error"
                    ? "fa-exclamation-circle"
                    : type === "warning"
                    ? "fa-exclamation-triangle"
                    : "fa-info-circle"
                } mr-2"></i>
                <span>${message}</span>
            </div>
        `;
    document.body.appendChild(notification);

    // Animate in with bounce
    setTimeout(() => {
      notification.classList.remove("translate-y-full", "opacity-0");
      notification.classList.add("animate-bounce");
      setTimeout(() => {
        notification.classList.remove("animate-bounce");
      }, 1000);
    }, 100);

    // Remove after 3 seconds with fade out
    setTimeout(() => {
      notification.classList.add("translate-y-full", "opacity-0");
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  },

  // Update dashboard
  updateDashboard() {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const dashboardContent = document.getElementById("dashboard");
    if (!dashboardContent) return;

    // Create inventory status overview section
    const statusOverview = document.createElement("div");
    statusOverview.className = "mb-6 bg-white rounded-lg shadow p-4";
    statusOverview.innerHTML = `
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Inventory Status Overview</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-green-800">In Stock</h3>
                            <p class="text-2xl font-semibold text-green-600">${
                              products.filter((p) => p.quantity >= 10).length
                            }</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-yellow-800">Low Stock</h3>
                            <p class="text-2xl font-semibold text-yellow-600">${
                              products.filter(
                                (p) => p.quantity > 0 && p.quantity < 10
                              ).length
                            }</p>
                        </div>
                        <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-exclamation-circle text-yellow-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-red-800">Out of Stock</h3>
                            <p class="text-2xl font-semibold text-red-600">${
                              products.filter((p) => p.quantity === 0).length
                            }</p>
                        </div>
                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-times-circle text-red-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-blue-800">Total Products</h3>
                            <p class="text-2xl font-semibold text-blue-600">${
                              products.length
                            }</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-box text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-gray-800">Total Inventory Value</h3>
                            <p class="text-2xl font-semibold text-gray-600">₹${products
                              .reduce(
                                (sum, item) => sum + item.price * item.quantity,
                                0
                              )
                              .toFixed(2)}</p>
                        </div>
                        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-rupee-sign text-gray-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-medium text-purple-800">Categories</h3>
                            <p class="text-2xl font-semibold text-purple-600">${
                              new Set(products.map((p) => p.category)).size
                            }</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-tags text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Update the dashboard content
    dashboardContent.innerHTML = "";
    dashboardContent.appendChild(statusOverview);

    // Add inventory table
    const inventoryTable = document.createElement("div");
    inventoryTable.className = "bg-white rounded-lg shadow overflow-hidden";
    inventoryTable.innerHTML = `
            <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Inventory Management</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${products
                          .map((product) => {
                            const stockStatus =
                              product.quantity === 0
                                ? "Out of Stock"
                                : product.quantity < 10
                                ? "Low Stock"
                                : "In Stock";
                            const statusColor =
                              product.quantity === 0
                                ? "red"
                                : product.quantity < 10
                                ? "yellow"
                                : "green";
                            return `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="flex-shrink-0 h-10 w-10">
                                                <img class="h-10 w-10 rounded-full object-cover" src="${
                                                  product.image
                                                }" alt="${product.name}">
                                            </div>
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">${
                                                  product.name
                                                }</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">${
                                          product.category
                                        }</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="uiManager.updateStockQuantity(${
                                              product.id
                                            }, -1)" 
                                                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 transition-colors duration-200">
                                                <i class="fas fa-minus"></i>
                                            </button>
                                            <span class="text-sm font-medium">${
                                              product.quantity
                                            }</span>
                                            <button onclick="uiManager.updateStockQuantity(${
                                              product.id
                                            }, 1)" 
                                                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 transition-colors duration-200">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800">
                                            ${stockStatus}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹${product.price.toFixed(2)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center">
                                        <button onclick="uiManager.deleteProduct(${
                                          product.id
                                        })" 
                                            class="text-red-600 hover:text-red-900">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
    dashboardContent.appendChild(inventoryTable);
  },

  // Update stock quantity
  updateStockQuantity(productId, change) {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const product = products.find((p) => p.id === productId);

    if (product) {
      const newQuantity = Math.max(0, product.quantity + change);
      product.quantity = newQuantity;

      // Save updated products
      localStorage.setItem("products", JSON.stringify(products));

      // Update displays
      this.displayProducts(products);
      this.updateDashboard();
      this.updateInventoryStats();
      this.updateShopStats();

      // Show notification with animation
      const message = change > 0 ? "Stock increased" : "Stock decreased";
      this.showNotification(`${message} for ${product.name}`, "success");

      // Add animation to the quantity display
      const quantityElement = document.querySelector(
        `[data-product-id="${productId}"] .quantity-display`
      );
      if (quantityElement) {
        quantityElement.classList.add("animate-bounce");
        setTimeout(
          () => quantityElement.classList.remove("animate-bounce"),
          1000
        );
      }
    }
  },

  // Quick update stock
  quickUpdateStock(productId) {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const product = products.find((p) => p.id === productId);

    if (product) {
      // Create modal for quick stock update
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50";
      modal.innerHTML = `
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Update Stock</h3>
                            <button onclick="uiManager.closeStockModal()" class="text-gray-400 hover:text-gray-500">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="mt-2 px-7 py-3">
                            <div class="mb-4">
                                <div class="flex items-center justify-between mb-2">
                                    <label class="block text-sm font-medium text-gray-700">Product</label>
                                    <span class="text-sm text-gray-500">${product.name}</span>
                                </div>
                                <div class="flex items-center justify-between mb-2">
                                    <label class="block text-sm font-medium text-gray-700">Current Stock</label>
                                    <span class="text-sm text-gray-500">${product.quantity} units</span>
                                </div>
                                <div class="mt-4">
                                    <label for="newStockQuantity" class="block text-sm font-medium text-gray-700 mb-2">New Stock Quantity</label>
                                    <div class="flex items-center space-x-2">
                                        <button onclick="uiManager.adjustModalQuantity(-1)" 
                                            class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 transition-colors duration-200">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <input type="number" id="newStockQuantity" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            min="0" value="${product.quantity}">
                                        <button onclick="uiManager.adjustModalQuantity(1)" 
                                            class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 transition-colors duration-200">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end space-x-3">
                                <button onclick="uiManager.closeStockModal()" 
                                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                                    Cancel
                                </button>
                                <button onclick="uiManager.saveStockUpdate(${productId})" 
                                    class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    }
  },

  // Adjust modal quantity
  adjustModalQuantity(change) {
    const input = document.getElementById("newStockQuantity");
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, currentValue + change);
    input.value = newValue;
  },

  // Save stock update
  saveStockUpdate(productId) {
    const newQuantity = parseInt(
      document.getElementById("newStockQuantity").value
    );
    if (isNaN(newQuantity) || newQuantity < 0) {
      this.showNotification("Please enter a valid quantity", "error");
      return;
    }

    const products = JSON.parse(localStorage.getItem("products")) || [];
    const product = products.find((p) => p.id === productId);

    if (product) {
      product.quantity = newQuantity;

      // Save updated products
      localStorage.setItem("products", JSON.stringify(products));

      // Update displays
      this.displayProducts(products);
      this.updateDashboard();
      this.updateInventoryStats();
      this.updateShopStats();

      // Close modal
      this.closeStockModal();

      // Show notification
      this.showNotification(`Stock updated for ${product.name}`, "success");
    }
  },

  // Delete product
  deleteProduct(productId) {
    if (confirm("Are you sure you want to delete this product?")) {
      const products = JSON.parse(localStorage.getItem("products")) || [];
      const updatedProducts = products.filter(
        (product) => product.id !== productId
      );
      localStorage.setItem("products", JSON.stringify(updatedProducts));

      // Remove from cart if present
      this.cart = this.cart.filter((item) => item.id !== productId);
      localStorage.setItem("cart", JSON.stringify(this.cart));

      // Update all displays
      this.displayProducts(updatedProducts);
      this.updateDashboard();
      this.updateInventoryStats();
      this.updateShopStats();
      this.updateCart();
      this.updateCartBadge();

      this.showNotification("Product deleted successfully!", "success");
    }
  },

  // Edit product
  editProduct(productId) {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const product = products.find((p) => p.id === productId);

    if (product) {
      // Populate the form with product data
      document.getElementById("productName").value = product.name;
      document.getElementById("productCategory").value = product.category;
      document.getElementById("productPrice").value = product.price;
      document.getElementById("productQuantity").value = product.quantity;
      document.getElementById("productDescription").value = product.description;

      // Navigate to inventory page
      this.navigateTo("inventory");

      // Scroll to form
      document
        .getElementById("addItemForm")
        .scrollIntoView({ behavior: "smooth" });
    }
  },

  // Handle adding new product
  async handleAddProduct(event) {
    event.preventDefault();
    const form = event.target;

    // Reset all error states
    const errorElements = document.querySelectorAll('[id$="Error"]');
    errorElements.forEach(el => el.classList.add('hidden'));
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    });

    // Validate all fields
    let hasError = false;

    // Validate product name
    const nameInput = form.productName;
    const nameError = document.getElementById('nameError');
    if (!nameInput.value.trim()) {
      nameError.classList.remove('hidden');
      nameInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      hasError = true;
    }

    // Check for duplicate product name
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const productName = nameInput.value.trim();
    const isDuplicate = products.some(product => 
      product.name.toLowerCase() === productName.toLowerCase()
    );

    if (isDuplicate) {
      nameError.textContent = "A product with this name already exists";
      nameError.classList.remove('hidden');
      nameInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      hasError = true;
    }

    // Validate category
    const categorySelect = form.productCategory;
    const categoryError = document.getElementById('categoryError');
    if (!categorySelect.value || categorySelect.value === '') {
      categoryError.classList.remove('hidden');
      categorySelect.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      hasError = true;
    }

    // Validate price
    const priceInput = form.productPrice;
    const priceError = document.getElementById('priceError');
    if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
      priceError.classList.remove('hidden');
      priceInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      hasError = true;
    }

    // Validate quantity
    const quantityInput = form.productQuantity;
    const quantityError = document.getElementById('quantityError');
    if (!quantityInput.value || parseInt(quantityInput.value) < 0) {
      quantityError.classList.remove('hidden');
      quantityInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      hasError = true;
    }

    // Validate description
    const descriptionInput = form.productDescription;
    const descriptionError = document.getElementById('descriptionError');
    if (!descriptionInput.value.trim()) {
      descriptionError.classList.remove('hidden');
      descriptionInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      hasError = true;
    }

    if (hasError) {
      this.showNotification("Please fill in all required fields correctly!", "error");
      return;
    }

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding Product...
        `;
    submitButton.disabled = true;

    try {
      const imageUrl = await this.getRandomImage(
        form.productName.value,
        form.productCategory.value
      );

      const newProduct = {
        id: Date.now(),
        name: form.productName.value.trim(),
        category: form.productCategory.value,
        price: parseFloat(form.productPrice.value),
        quantity: parseInt(form.productQuantity.value),
        image: imageUrl,
        description: form.productDescription.value.trim(),
        cost: parseFloat(form.productPrice.value) * 0.6,
      };

      products.push(newProduct);
      localStorage.setItem("products", JSON.stringify(products));

      // Update all displays
      this.displayProducts(products);
      this.updateDashboard();
      this.updateInventoryStats();
      this.updateShopStats();
      form.reset();

      // Reset all error states
      errorElements.forEach(el => el.classList.add('hidden'));
      inputs.forEach(input => {
        input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
      });

      this.showNotification("Product added successfully!", "success");
    } catch (error) {
      console.error("Error adding product:", error);
      this.showNotification("Error adding product. Please try again.", "error");
    } finally {
      submitButton.innerHTML = originalButtonText;
      submitButton.disabled = false;
    }
  },

  // Initialize cart timer
  initializeCartTimer() {
    if (this.cartTimer) {
      clearInterval(this.cartTimer);
    }

    const expiryTime = document.getElementById("cartExpiryTime");
    let hours = 24;
    let minutes = 0;
    let seconds = 0;

    this.cartTimer = setInterval(() => {
      if (seconds === 0) {
        if (minutes === 0) {
          if (hours === 0) {
            clearInterval(this.cartTimer);
            this.cart = [];
            localStorage.removeItem("cart");
            this.updateCart();
            return;
          }
          hours--;
          minutes = 59;
        } else {
          minutes--;
        }
        seconds = 59;
      } else {
        seconds--;
      }

      expiryTime.textContent = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, 1000);
  },

  // Initialize page transitions
  initializePageTransitions() {
    // Add transition classes to all pages
    document.querySelectorAll(".page-content").forEach((page) => {
      page.classList.add("transition-all", "duration-300", "ease-in-out");
    });

    // Restore last visited page if available
    const lastPage = localStorage.getItem("currentPage");
    if (lastPage) {
      this.showPage(lastPage);
    }
  },

  // Get random image for product
  async getRandomImage(productName, category) {
    const searchTerms = [category];

    // Add product name to search terms
    searchTerms.unshift(productName);

    // Randomly select a search term
    const randomTerm =
      searchTerms[Math.floor(Math.random() * searchTerms.length)];

    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${randomTerm}&client_id=YOUR_UNSPLASH_ACCESS_KEY`
      );
      const data = await response.json();
      return data.urls.regular;
    } catch (error) {
      console.error("Error fetching image:", error);
      // Fallback to a default image if the API call fails
      return "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
    }
  },

  resetProducts() {
    if (confirm("Are you sure you want to reset all products? This will restore the sample products.")) {
      localStorage.setItem("productsReset", "true");
      localStorage.removeItem("products");
      localStorage.removeItem("productsReset");
      this.initializeProducts();
      this.displayProducts(JSON.parse(localStorage.getItem("products")) || []);
      this.updateDashboard();
      this.updateInventoryStats();
      this.updateShopStats();
      this.showNotification("Products have been reset to sample data!", "success");
    }
  },
};
