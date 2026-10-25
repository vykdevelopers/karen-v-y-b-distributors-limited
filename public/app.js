const app = document.getElementById("app");
const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("kvyb_token");
}
function setToken(token) {
  if (token) localStorage.setItem("kvyb_token", token);
  else localStorage.removeItem("kvyb_token");
}
function setUser(user) {
  if (user) localStorage.setItem("kvyb_user", JSON.stringify(user));
  else localStorage.removeItem("kvyb_user");
}
function getUser() {
  const raw = localStorage.getItem("kvyb_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed.");
  return data;
}

function isStrongPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
}

function renderLandingPage() {
  app.innerHTML = `
    <div class="container">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">K</div>
          <div>KAREN-V-Y-B</div>
        </div>

        <nav class="nav">
          <a href="#">Home</a>
          <a href="#products">Products</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div class="actions">
          <div class="search-box">Search</div>
          <button class="btn secondary" onclick="showAuth('login')">Login</button>
          <button class="btn" onclick="showAuth('signup')">Create Account</button>
        </div>
      </header>

      <section class="hero">
        <div class="hero-large">
          <div class="hero-content">
            <div class="kicker">Hardware Equipment</div>
            <h1>Karen-V-Y-B<br>Distributors Limited</h1>
            <p>Trusted supplier of industrial tools, hardware equipment, electrical products and workshop essentials.</p>
            <div class="cta-row">
              <button class="btn" onclick="showAuth('signup')">Get Started</button>
              <button class="btn secondary" onclick="showAuth('login')">Customer Login</button>
            </div>
          </div>
        </div>

        <div class="card pad">
          <div class="panel-head">
            <div class="title">Quick Stats</div>
            <div class="tiny">Live</div>
          </div>

          <div class="stats-grid">
            <div class="metric"><div class="label">Products</div><div class="value">1.2k</div></div>
            <div class="metric"><div class="label">Clients</div><div class="value">480</div></div>
            <div class="metric"><div class="label">Orders</div><div class="value">742</div></div>
          </div>
        </div>

        <div class="card pad">
          <div class="panel-head">
            <div class="title">Support</div>
            <div class="tiny">24/7</div>
          </div>

          <div class="list">
            <div class="list-item">
              <div><strong>Phone</strong><br><span class="tiny">0118078137</span></div>
              <span class="badge">Call</span>
            </div>

            <div class="list-item">
              <div><strong>Email</strong><br><span class="tiny">karenvyb6765@gmail.com</span></div>
              <span class="badge">Mail</span>
            </div>
          </div>
        </div>
      </section>

      <section id="products" class="content-grid">
        <div class="card section-box">
          <div class="panel-head">
            <div class="title">Featured Products</div>
            <div class="tiny">Reliable stock</div>
          </div>
          <div id="landing-products" class="product-grid"></div>
        </div>

        <div class="card section-box">
          <div class="panel-head">
            <div class="title">Popular Categories</div>
            <div class="tiny">Hardware</div>
          </div>

          <div class="list">
            <div class="list-item"><div>Power Tools</div><span class="badge">330</span><strong>KSh 420k</strong></div>
            <div class="list-item"><div>Electrical</div><span class="badge">190</span><strong>KSh 260k</strong></div>
            <div class="list-item"><div>Safety Gear</div><span class="badge">270</span><strong>KSh 180k</strong></div>
          </div>
        </div>

        <div class="card section-box">
          <div class="panel-head">
            <div class="title">Monthly Sales</div>
            <div class="tiny">This month</div>
          </div>
          <div class="chart"></div>
        </div>
      </section>

      <div id="about" class="footer-contact">
        <div class="panel-head">
          <div class="title">About Us</div>
          <div class="tiny">Your trusted supplier</div>
        </div>

        <div class="contact-grid">
          <div class="contact-block">
            <strong>Who We Are</strong><br><br>
            Karen-V-Y-B Distributors Limited supplies quality tools, industrial hardware, electrical equipment and workshop essentials for businesses and homes.
          </div>

          <div class="contact-block">
            <strong>Why Choose Us</strong><br><br>
            Trusted quality, consistent supply, competitive pricing, fast support and reliable customer service.
          </div>

          <div class="contact-block">
            <strong>Contact</strong><br><br>
            Phone: 0118078137<br>
            Email: karenvyb6765@gmail.com
          </div>
        </div>
      </div>

      <div id="contact" class="footer-contact">
        <div class="panel-head">
          <div class="title">Contact Us</div>
          <div class="tiny">Business support</div>
        </div>

        <div class="contact-grid">
          <div class="contact-block"><strong>Call Us</strong><br><br>0118078137</div>
          <div class="contact-block"><strong>Email Us</strong><br><br>karenvyb6765@gmail.com</div>
          <div class="contact-block"><strong>Business Hours</strong><br><br>Mon - Sat: 8:00 AM - 6:00 PM</div>
        </div>
      </div>
    </div>
  `;

  loadLandingProducts();
}

async function loadLandingProducts() {
  try {
    const items = await apiFetch("/catalog");
    const container = document.getElementById("landing-products");
    if (!container) return;

    container.innerHTML = items.slice(0, 3).map(item => `
      <div class="product-card">
        <div class="product-image" style="background-image: url('${item.image}')"></div>
        <div class="product-line">
          <div class="product-name">${item.name}</div>
          <div class="product-price">KSh ${Number(item.price).toLocaleString()}</div>
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error(error);
  }
}

function showAuth(type) {
  const modal = document.createElement("div");
  modal.className = "modal";

  if (type === "login") {
    modal.innerHTML = `
      <div class="modal-inner">
        <h3>Customer Login</h3>
        <form id="login-form" class="form-wrap">
          <div><label>Email or Phone</label><input type="text" id="login-identifier" required /></div>
          <div><label>Password</label><input type="password" id="login-password" required /></div>
          <div class="row">
            <label><input type="checkbox" /> Remember me</label>
            <a href="#" onclick="showAuth('forgot')">Forgot password?</a>
          </div>
          <button type="submit" class="btn" style="width:100%;">Login</button>
        </form>
        <div class="modal-actions">
          <button class="btn secondary" onclick="closeModal()">Close</button>
          <button class="btn secondary" onclick="showAuth('signup')">Create account</button>
        </div>
      </div>
    `;
  }

  if (type === "signup") {
    modal.innerHTML = `
      <div class="modal-inner">
        <h3>Create Customer Account</h3>
        <form id="signup-form" class="form-wrap">
          <div class="form-grid">
            <div><label>Full Name</label><input type="text" id="signup-name" required /></div>
            <div><label>Business Name</label><input type="text" id="signup-business" /></div>
          </div>
          <div class="form-grid">
            <div><label>Email</label><input type="email" id="signup-email" required /></div>
            <div><label>Phone</label><input type="tel" id="signup-phone" required /></div>
          </div>
          <div><label>Password</label><input type="password" id="signup-password" required /></div>
          <div><label>Confirm Password</label><input type="password" id="signup-confirm" required /></div>
          <div><label><input type="checkbox" id="signup-terms" required /> I agree to the terms</label></div>
          <button type="submit" class="btn" style="width:100%;">Create Account</button>
        </form>
        <div class="modal-actions">
          <button class="btn secondary" onclick="closeModal()">Close</button>
          <button class="btn secondary" onclick="showAuth('login')">Login instead</button>
        </div>
      </div>
    `;
  }

  if (type === "forgot") {
    modal.innerHTML = `
      <div class="modal-inner">
        <h3>Forgot Password</h3>
        <form id="forgot-form" class="form-wrap">
          <div><label>Email or Phone</label><input type="text" id="forgot-identifier" required /></div>
          <button type="submit" class="btn" style="width:100%;">Send OTP</button>
        </form>

        <div id="otp-step" style="display:none; margin-top:16px;">
          <label>OTP Code</label>
          <input type="text" id="otp-input" placeholder="Enter OTP" />
          <div class="row" style="margin-top:12px;">
            <button class="btn" onclick="verifyResetOtp()">Verify OTP</button>
            <button class="btn secondary" onclick="showAuth('login')">Back</button>
          </div>
        </div>
      </div>
    `;
  }

  app.appendChild(modal);

  if (type === "login") {
    document.getElementById("login-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      const identifier = document.getElementById("login-identifier").value.trim();
      const password = document.getElementById("login-password").value;

      try {
        const data = await apiFetch("/login", {
          method: "POST",
          body: JSON.stringify({ identifier, password })
        });

        setToken(data.token);
        setUser(data.user);
        closeModal();

        if (data.user.role === "admin") renderAdminDashboard();
        else renderCustomerDashboard();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (type === "signup") {
    document.getElementById("signup-form").addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("signup-name").value.trim();
      const businessName = document.getElementById("signup-business").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const phone = document.getElementById("signup-phone").value.trim();
      const password = document.getElementById("signup-password").value;
      const confirmPassword = document.getElementById("signup-confirm").value;
      const agreed = document.getElementById("signup-terms").checked;

      if (!agreed) { alert("You must agree to the terms."); return; }
      if (!isStrongPassword(password)) { alert("Password must contain uppercase, lowercase, number and special character."); return; }
      if (password !== confirmPassword) { alert("Passwords do not match."); return; }

      try {
        await apiFetch("/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, phone, businessName, password, confirmPassword })
        });
        alert("Your account was created successfully.");
        closeModal();
        showAuth("login");
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (type === "forgot") {
    document.getElementById("forgot-form").addEventListener("submit", async function (e) {
      e.preventDefault();

      const identifier = document.getElementById("forgot-identifier").value.trim();

      try {
        const data = await apiFetch("/forgot-password", {
          method: "POST",
          body: JSON.stringify({ identifier })
        });

        window.__otpResetUser = identifier;
        document.getElementById("otp-step").style.display = "block";
        alert(`OTP sent successfully. Demo OTP: ${data.otp}`);
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

function closeModal() {
  const modal = document.querySelector(".modal");
  if (modal) modal.remove();
}

async function verifyResetOtp() {
  const otp = document.getElementById("otp-input").value.trim();
  const identifier = window.__otpResetUser;

  if (!identifier || !otp) {
    alert("Please enter the OTP.");
    return;
  }

  const newPassword = prompt("Enter your new password:");
  if (!newPassword) return;

  if (!isStrongPassword(newPassword)) {
    alert("Password is too weak. Use uppercase, lowercase, number, and special character.");
    return;
  }

  try {
    await apiFetch("/reset-password", {
      method: "POST",
      body: JSON.stringify({ identifier, otp, newPassword })
    });

    alert("Password updated successfully.");
    closeModal();
    showAuth("login");
  } catch (err) {
    alert(err.message);
  }
}

function logout() {
  setToken(null);
  setUser(null);
  renderLandingPage();
}

async function renderCustomerDashboard() {
  const user = getUser();
  if (!user) return renderLandingPage();

  try {
    const orders = await apiFetch("/customer/orders");

    app.innerHTML = `
      <div class="container">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">K</div>
            <div>KAREN-V-Y-B</div>
          </div>

          <nav class="nav">
            <a href="#">Dashboard</a>
            <a href="#">Orders</a>
            <a href="#">Profile</a>
          </nav>

          <div class="actions">
            <div class="search-box">Welcome, ${user.name}</div>
            <button class="btn secondary" onclick="logout()">Logout</button>
          </div>
        </header>

        <div class="content-grid" style="margin-top:18px;">
          <div class="card section-box">
            <div class="panel-head">
              <div class="title">Place Order</div>
              <div class="tiny">Customer Portal</div>
            </div>

            <form id="customer-order-form" class="form-wrap">
              <div>
                <label>Product</label>
                <select id="product-select"></select>
              </div>

              <div>
                <label>Quantity</label>
                <input type="number" id="order-qty" value="1" min="1" />
              </div>

              <div>
                <label>Delivery Location</label>
                <textarea id="order-location" placeholder="Enter delivery address"></textarea>
              </div>

              <button type="submit" class="btn" style="width:100%;">Place Order</button>
            </form>
          </div>

          <div class="card section-box">
            <div class="panel-head">
              <div class="title">Profile</div>
              <div class="tiny">Account</div>
            </div>

            <div class="list">
              <div class="list-item">
                <div><strong>Name</strong><br><span class="tiny">${user.name}</span></div>
              </div>

              <div class="list-item">
                <div><strong>Email</strong><br><span class="tiny">${user.email}</span></div>
              </div>

              <div class="list-item">
                <div><strong>Phone</strong><br><span class="tiny">${user.phone}</span></div>
              </div>

              <div class="list-item">
                <div><strong>Business</strong><br><span class="tiny">${user.businessName || "Not provided"}</span></div>
              </div>
            </div>
          </div>

          <div class="card section-box">
            <div class="panel-head">
              <div class="title">Order Summary</div>
              <div class="tiny">Today</div>
            </div>

            <div class="list">
              <div class="list-item">
                <div>Total Orders</div>
                <span class="badge">${orders.length}</span>
              </div>

              <div class="list-item">
                <div>Pending</div>
                <span class="badge">${orders.filter(o => o.status === "Pending").length}</span>
              </div>

              <div class="list-item">
                <div>Completed</div>
                <span class="badge">${orders.filter(o => o.status === "Completed").length}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card section-box" style="margin-top:18px;">
          <div class="panel-head">
            <div class="title">My Order History</div>
            <div class="tiny">Recent</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length ? orders.map(order => `
                <tr>
                  <td>${order.id.slice(0, 8)}</td>
                  <td>${order.product_name}</td>
                  <td>${order.quantity}</td>
                  <td>${order.status}</td>
                  <td>KSh ${Number(order.total).toLocaleString()}</td>
                </tr>
              `).join("") : `
                <tr>
                  <td colspan="5">No orders placed yet.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const products = await apiFetch("/catalog");
    const select = document.getElementById("product-select");
    select.innerHTML = products.map(item => `
      <option value="${item.id}">${item.name} - KSh ${Number(item.price).toLocaleString()}</option>
    `).join("");

    document.getElementById("customer-order-form").addEventListener("submit", async function (e) {
      e.preventDefault();

      const productId = document.getElementById("product-select").value;
      const quantity = Number(document.getElementById("order-qty").value);
      const location = document.getElementById("order-location").value.trim();

      try {
        await apiFetch("/orders", {
          method: "POST",
          body: JSON.stringify({ productId, quantity, location })
        });

        alert("Order placed successfully.");
        renderCustomerDashboard();
      } catch (err) {
        alert(err.message);
      }
    });
  } catch (err) {
    alert(err.message);
  }
}

async function renderAdminDashboard() {
  try {
    const summary = await apiFetch("/admin/summary");
    const customers = await apiFetch("/admin/customers");
    const orders = await apiFetch("/admin/orders");
    const catalog = await apiFetch("/catalog");

    app.innerHTML = `
      <div class="container">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">K</div>
            <div>KAREN-V-Y-B ADMIN</div>
          </div>

          <nav class="nav">
            <a href="#">Dashboard</a>
            <a href="#">Orders</a>
            <a href="#">Catalog</a>
            <a href="#">Customers</a>
          </nav>

          <div class="actions">
            <div class="search-box">Admin Console</div>
            <button class="btn secondary" onclick="logout()">Logout</button>
          </div>
        </header>

        <div class="content-grid" style="margin-top:18px;">
          <div class="card section-box">
            <div class="panel-head">
              <div class="title">Overview</div>
              <div class="tiny">System</div>
            </div>

            <div class="stats-grid">
              <div class="metric"><div class="label">Customers</div><div class="value">${summary.customerCount}</div></div>
              <div class="metric"><div class="label">Orders</div><div class="value">${summary.orderCount}</div></div>
              <div class="metric"><div class="label">Products</div><div class="value">${summary.productCount}</div></div>
            </div>
          </div>

          <div class="card section-box">
            <div class="panel-head">
              <div class="title">Add Product</div>
              <div class="tiny">Catalog</div>
            </div>

            <form id="admin-product-form" class="form-wrap">
              <input type="hidden" id="product-id" />

              <div class="form-grid">
                <div><label>Product Name</label><input type="text" id="product-name" required /></div>
                <div><label>Category</label><input type="text" id="product-category" required /></div>
              </div>

              <div class="form-grid">
                <div><label>Price</label><input type="number" id="product-price" min="0" required /></div>
                <div><label>Stock</label><input type="number" id="product-stock" min="0" required /></div>
              </div>

              <div><label>Description</label><textarea id="product-description"></textarea></div>
              <div><label>Image URL</label><input type="url" id="product-image" placeholder="https://..." /></div>

              <div class="row">
                <button type="submit" class="btn">Save Product</button>
                <button type="button" class="btn secondary" onclick="resetAdminForm()">Clear</button>
              </div>
            </form>
          </div>

          <div class="card section-box">
            <div class="panel-head">
              <div class="title">Recent Orders</div>
              <div class="tiny">Live logs</div>
            </div>

            <div class="list">
              ${orders.slice(0,4).map(order => `
                <div class="list-item">
                  <div>
                    <strong>${order.product_name}</strong><br>
                    <span class="tiny">${order.customer_name}</span>
                  </div>
                  <span class="badge">${order.status}</span>
                  <strong>KSh ${Number(order.total).toLocaleString()}</strong>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="card section-box" style="margin-top:18px;">
          <div class="panel-head">
            <div class="title">Catalog</div>
            <div class="tiny">Edit / Delete</div>
          </div>

          <div class="catalog-list">
            ${catalog.map(item => `
              <div class="catalog-item">
                <img src="${item.image}" alt="${item.name}" />
                <div class="catalog-meta">
                  <strong>${item.name}</strong>
                  <span>${item.category}</span>
                  <span>KSh ${Number(item.price).toLocaleString()} • Stock: ${item.stock}</span>
                </div>
                <div class="catalog-actions">
                  <button class="small-btn" onclick="adminEditProduct('${item.id}')">Edit</button>
                  <button class="small-btn" style="background: rgba(92,14,23,0.9); border: 1px solid rgba(255,95,125,0.24);" onclick="adminDeleteProduct('${item.id}')">Delete</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card section-box" style="margin-top:18px;">
          <div class="panel-head">
            <div class="title">Customer Log</div>
            <div class="tiny">Accounts</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map(c => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.username || "-"}</td>
                  <td>${c.email}</td>
                  <td>${c.phone}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("admin-product-form").addEventListener("submit", async function (e) {
      e.preventDefault();

      const id = document.getElementById("product-id").value;
      const name = document.getElementById("product-name").value.trim();
      const category = document.getElementById("product-category").value.trim();
      const price = Number(document.getElementById("product-price").value);
      const stock = Number(document.getElementById("product-stock").value);
      const description = document.getElementById("product-description").value.trim();
      const image = document.getElementById("product-image").value.trim();

      try {
        if (id) {
          await apiFetch(`/admin/products/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name, category, price, stock, description, image })
          });
        } else {
          await apiFetch("/admin/products", {
            method: "POST",
            body: JSON.stringify({ name, category, price, stock, description, image })
          });
        }

        alert("Product saved successfully.");
        renderAdminDashboard();
      } catch (err) {
        alert(err.message);
      }
    });
  } catch (err) {
    alert(err.message);
  }
}

function resetAdminForm() {
  document.getElementById("admin-product-form").reset();
  document.getElementById("product-id").value = "";
}

async function adminEditProduct(id) {
  try {
    const catalog = await apiFetch("/catalog");
    const item = catalog.find(p => p.id === id);
    if (!item) return;

    document.getElementById("product-id").value = item.id;
    document.getElementById("product-name").value = item.name;
    document.getElementById("product-category").value = item.category;
    document.getElementById("product-price").value = item.price;
    document.getElementById("product-stock").value = item.stock;
    document.getElementById("product-description").value = item.description || "";
    document.getElementById("product-image").value = item.image || "";
  } catch (err) {
    alert(err.message);
  }
}

async function adminDeleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
    alert("Product deleted successfully.");
    renderAdminDashboard();
  } catch (err) {
    alert(err.message);
  }
}

function initApp() {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    if (user.role === "admin") renderAdminDashboard();
    else renderCustomerDashboard();
    return;
  }

  renderLandingPage();
}

window.addEventListener("DOMContentLoaded", initApp);
window.showAuth = showAuth;
window.closeModal = closeModal;
window.logout = logout;
window.verifyResetOtp = verifyResetOtp;
window.adminEditProduct = adminEditProduct;
window.adminDeleteProduct = adminDeleteProduct;
window.resetAdminForm = resetAdminForm;
