const WidgetConfig = require("../models/WidgetConfig");
const Tenant = require("../models/Tenant");

/**
 * Get or create widget config for a tenant.
 * On first call, seeds defaults from tenant data.
 */
const getWidgetConfig = async (tenantId) => {
  let config = await WidgetConfig.findOne({ tenantId });

  if (!config) {
    const tenant = await Tenant.findOne({ tenantId });
    config = await WidgetConfig.create({
      tenantId,
      companyName: tenant?.companyName || "",
      companyLogo: tenant?.companyLogo || null,
    });
  }

  return config;
};

/**
 * Update widget config.
 */
const updateWidgetConfig = async (tenantId, updates) => {
  const config = await WidgetConfig.findOneAndUpdate(
    { tenantId },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  return config;
};

/**
 * Generate the embed script snippet for a tenant's widget.
 */
const generateEmbedScript = (widgetKey, config) => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
  return `<!-- NextGen AI Services Widget -->
<script>
  window.NextGenAIConfig = window.NextGenAIConfig || {
    widgetKey: "${widgetKey}",
    primaryColor: "${config.primaryColor}",
    position: "${config.widgetPosition}"
  };
  (function(d,s,id){
    var js,fjs=d.getElementsByTagName(s)[0];
    if(d.getElementById(id))return;
    js=d.createElement(s);js.id=id;
    js.src="${baseUrl}/api/widget/widget.js";
    fjs.parentNode.insertBefore(js,fjs);
  }(document,'script','nextgen-ai-sdk'));
</script>`;
};

module.exports = { getWidgetConfig, updateWidgetConfig, generateEmbedScript };