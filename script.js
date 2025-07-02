document.addEventListener('DOMContentLoaded', () => {
    const employeeNameInput = document.getElementById('employeeName');
    const agentSelect = document.getElementById('agentSelect');
    const customerSearchInput = document.getElementById('customerSearch');
    const customerSelect = document.getElementById('customerSelect');
    const productsContainer = document.getElementById('productsContainer');
    const submitBtn = document.getElementById('submitBtn');
    const responseMessage = document.getElementById('responseMessage');

    let agents = [];
    let customers = [];
    let productsByCategory = {}; // ستحتوي على المنتجات مصنفة حسب الفئة

    // قائمة بالوحدات المتاحة للاختيار (يمكنك تعديلها حسب حاجتك)
    const availableUnits = ['حبة', 'علبة', 'باكت', 'شدة', 'كرتون', 'كيلو', 'لتر', 'متر', 'مجموعة'];

    // URL لـ Google Apps Script Web App (ستحصل عليه بعد النشر)
    const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6jOwIBslmffRtj7dsGx7Dl7Z7eSfSF30YPym1wBqxDALCv4nu3b48f7g1rrKgWeTx-g/exec';
    // استبدل هذا بالرابط الفعلي لتطبيق الويب الخاص بك

    // ----------------------------------------------------
    // وظائف جلب البيانات من ملفات JSON
    // ----------------------------------------------------
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            responseMessage.className = 'error';
            responseMessage.textContent = `فشل في تحميل البيانات: ${error.message}`;
            return url.includes('products.json') ? {} : []; // Return empty object for products, empty array for others
        }
    }

    async function loadAllData() {
        agents = await fetchData('agents.json');
        customers = await fetchData('customers.json');
        productsByCategory = await fetchData('products.json'); // جلب المنتجات حسب الفئة

        populateAgents();
        populateCustomers(customers); // Populate initially with all customers
        renderProducts(); // عرض المنتجات بناءً على الفئات
    }

    // ----------------------------------------------------
    // وظائف بناء الواجهة
    // ----------------------------------------------------

    // تعبئة قائمة المندوبين
    function populateAgents() {
        agentSelect.innerHTML = '<option value="">-- اختر مندوبًا --</option>';
        agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent;
            option.textContent = agent;
            agentSelect.appendChild(option);
        });
    }

    // تعبئة قائمة العملاء (مع دعم البحث)
    function populateCustomers(filteredCustomers) {
        customerSelect.innerHTML = ''; // Clear previous options
        if (filteredCustomers.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "لا يوجد عملاء مطابقون";
            customerSelect.appendChild(option);
            return;
        }
        filteredCustomers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer;
            option.textContent = customer;
            customerSelect.appendChild(option);
        });
    }

    // فلترة قائمة العملاء عند الكتابة في حقل البحث
    customerSearchInput.addEventListener('input', () => {
        const searchTerm = customerSearchInput.value.toLowerCase();
        const filtered = customers.filter(customer =>
            customer.toLowerCase().includes(searchTerm)
        );
        populateCustomers(filtered);
    });

    // عند اختيار عميل من القائمة المنسدلة، ضع اسمه في حقل البحث ليتضح للمستخدم
    customerSelect.addEventListener('change', () => {
        if (customerSelect.value) {
            customerSearchInput.value = customerSelect.value;
        }
    });

    // عرض المنتجات كفئات وأصناف مع حقول الكمية والوحدة والتاريخ
    function renderProducts() {
        productsContainer.innerHTML = '';

        for (const category in productsByCategory) {
            if (productsByCategory.hasOwnProperty(category)) {
                const productsInThisCategory = productsByCategory[category];

                const categoryGroup = document.createElement('div');
                categoryGroup.classList.add('category-group');

                const categoryTitle = document.createElement('h3');
                categoryTitle.classList.add('category-title');
                categoryTitle.textContent = category;
                categoryGroup.appendChild(categoryTitle);

                productsInThisCategory.forEach((product, index) => {
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');

                    const label = document.createElement('label');
                    label.textContent = product;
                    productItem.appendChild(label);

                    const productControls = document.createElement('div');
                    productControls.classList.add('product-controls');

                    // حقل الكمية
                    const quantityInput = document.createElement('input');
                    quantityInput.type = 'number';
                    quantityInput.min = '0';
                    quantityInput.placeholder = 'الكمية';
                    quantityInput.dataset.productName = product; // لحفظ اسم المنتج
                    quantityInput.classList.add('product-quantity'); // لإضافة فئة لسهولة الاستهداف
                    productControls.appendChild(quantityInput);

                    // قائمة منسدلة للوحدة
                    const unitSelect = document.createElement('select');
                    unitSelect.classList.add('product-unit'); // لإضافة فئة لسهولة الاستهداف
                    unitSelect.dataset.productName = product; // لحفظ اسم المنتج
                    let defaultOption = document.createElement('option');
                    defaultOption.value = "";
                    defaultOption.textContent = "-- وحدة --";
                    unitSelect.appendChild(defaultOption);

                    availableUnits.forEach(unit => {
                        const option = document.createElement('option');
                        option.value = unit;
                        option.textContent = unit;
                        unitSelect.appendChild(option);
                    });
                    productControls.appendChild(unitSelect);

                    // حقل تاريخ الصلاحية (اختياري)
                    const expiryDateInput = document.createElement('input');
                    expiryDateInput.type = 'date';
                    expiryDateInput.placeholder = 'تاريخ الصلاحية (اختياري)';
                    expiryDateInput.dataset.productName = product; // لحفظ اسم المنتج
                    expiryDateInput.classList.add('product-expiry-date'); // لإضافة فئة لسهولة الاستهداف
                    productControls.appendChild(expiryDateInput);


                    productItem.appendChild(productControls);
                    categoryGroup.appendChild(productItem);
                });
                productsContainer.appendChild(categoryGroup);
            }
        }
    }

    // ----------------------------------------------------
    // وظيفة جمع البيانات وإرسالها
    // ----------------------------------------------------

    submitBtn.addEventListener('click', async () => {
        // التحقق من صحة جميع المدخلات المطلوبة
        if (!employeeNameInput.value || !agentSelect.value || !customerSelect.value) {
            responseMessage.className = 'error';
            responseMessage.textContent = 'الرجاء تعبئة جميع الحقول المطلوبة (اسم الموظف، المندوب، العميل).';
            return;
        }

        const inventoryData = [];
        let allQuantitiesValid = true;

        // جمع كل المنتجات من جميع الفئات
        for (const category in productsByCategory) {
            if (productsByCategory.hasOwnProperty(category)) {
                productsByCategory[category].forEach(productName => {
                    const quantityInput = document.querySelector(`.product-quantity[data-product-name="${productName}"]`);
                    const unitSelect = document.querySelector(`.product-unit[data-product-name="${productName}"]`);
                    const expiryDateInput = document.querySelector(`.product-expiry-date[data-product-name="${productName}"]`);

                    const quantity = quantityInput ? parseInt(quantityInput.value) : 0;
                    const unit = unitSelect ? unitSelect.value : '';
                    const expiryDate = expiryDateInput ? expiryDateInput.value : ''; // يمكن أن يكون فارغًا

                    // التحقق: إذا تم إدخال كمية، فيجب أن تكون الوحدة مختارة
                    if (quantity > 0 && unit === '') {
                        allQuantitiesValid = false;
                        // يمكنك إضافة رسالة خطأ محددة هنا إذا أردت
                    }

                    // أضف المنتج إلى بيانات الجرد فقط إذا كانت الكمية أكبر من 0
                    if (quantity > 0) {
                        inventoryData.push({
                            product: productName,
                            quantity: quantity,
                            unit: unit,
                            expiry_date: expiryDate
                        });
                    }
                });
            }
        }

        if (!allQuantitiesValid) {
            responseMessage.className = 'error';
            responseMessage.textContent = 'الرجاء تحديد الوحدة لجميع المنتجات التي تم إدخال كميات لها.';
            return;
        }

        // تحضير البيانات للإرسال إلى Google Apps Script
        const now = new Date();
        const timestampDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const timestampTime = now.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS

        const formData = {
            Timestamp_Date: timestampDate,
            Timestamp_Time: timestampTime,
            Employee_Name: employeeNameInput.value,
            Agent_Name: agentSelect.value,
            Customer_Name: customerSelect.value,
            // سيتم إرسال بيانات المنتجات كـ JSON string
            Inventory_Data: JSON.stringify(inventoryData)
        };

        console.log('بيانات الإرسال:', formData); // للتأكد من البيانات قبل الإرسال

        try {
            responseMessage.textContent = 'جاري الإرسال...';
            responseMessage.className = '';

            const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // مهم للسماح بالطلبات العابرة للمجالات بدون تعقيد CORS على جانب الخادم
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(formData).toString(),
            });

            // نظرًا لاستخدام 'no-cors'، لا يمكننا التحقق من response.ok أو قراءة response.json()
            // سنفترض النجاح إذا لم يحدث خطأ شبكة.
            responseMessage.className = 'success';
            responseMessage.textContent = 'تم إرسال البيانات بنجاح!';

            // مسح الحقول بعد الإرسال الناجح
            employeeNameInput.value = '';
            agentSelect.value = '';
            customerSearchInput.value = '';
            customerSelect.innerHTML = ''; // Clear customer select
            populateCustomers(customers); // Repopulate with all customers
            renderProducts(); // Reset product inputs

        } catch (error) {
            console.error('خطأ في إرسال البيانات:', error);
            responseMessage.className = 'error';
            responseMessage.textContent = `حدث خطأ أثناء الإرسال: ${error.message}`;
        }
    });

    // تحميل جميع البيانات عند تحميل الصفحة
    loadAllData();
});