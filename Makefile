APP=boomerang-express
DEST=$(DESTDIR)/opt/nodejs/$(APP)
SHARE=$(CURDIR)/share
SERVICE=$(DESTDIR)/etc/init.d/$(APP)

install:
	cp -f $(SHARE)/init.d $(DESTDIR)/etc/init.d/$(APP)
	chmod +x $(DESTDIR)/etc/init.d/$(APP)
	cp -f $(SHARE)/default $(DESTDIR)/etc/default/$(APP)
	mkdir -p $(DEST)
	cp -rf $(CURDIR)/package.json $(DEST)/
	cp -rf $(CURDIR)/lib/ $(DEST)/
	cp -f $(CURDIR)/app.js $(DEST)/
	cp -br $(CURDIR)/config $(DEST)/

uninstall:
	$(SERVICE) stop
	rm -f $(DESTDIR)/etc/init.d/$(APP)
	rm -f $(DESTDIR)/etc/default/$(APP)
	rm -rf $(DEST)

