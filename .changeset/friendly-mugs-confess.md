---
"ui-test-visualizer": patch
---

Changed an 'await import(...)' to 'require(...)' to avoid the "ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING" error
when loading the Jest config file.

<https://github.com/PoffM/ui-test-visualizer/issues/3>
