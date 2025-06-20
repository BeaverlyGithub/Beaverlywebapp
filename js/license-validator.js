document.getElementById("license-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const mt5Account = document.getElementById("mt5-account").value.trim();
    const resultDiv = document.getElementById("validation-result");
    const loading = document.getElementById("loading");

    resultDiv.classList.add("hidden");
    loading.classList.remove("hidden");

    fetch(`https://cloud-m2-production.up.railway.app/api/license_status?mt5_id=${mt5Account}`)
        .then(res => {
            if (!res.ok) throw new Error("License not found");
            return res.json();
        })
        .then(data => {
            localStorage.setItem("validatedLicense", JSON.stringify(data));
            window.location.href = "download.html";
        })
        .catch(err => {
            resultDiv.innerHTML = `<p class="text-red-600 font-semibold">License not found or expired.</p>`;
            resultDiv.classList.remove("hidden");
        })
        .finally(() => loading.classList.add("hidden"));
});
