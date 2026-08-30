Name:           suncord
Version:        1.0.0
Release:        1%{?dist}
Summary:        Discord client mod with plugin and theme store
License:        MIT
URL:            https://github.com/Sunny-son-sahur/suncord
Source0:        %{name}-%{version}.tar.gz

Requires:       discord
Requires:       nodejs

%description
Suncord is a lightweight Discord client modification that adds a built-in
store for plugins and themes. Install them by dragging zip files, or browse
the online store. Compatible with Vencord themes and plugins.

%prep
%setup -q

%build
# Nothing to build — pre-built dist included

%install
mkdir -p %{buildroot}/usr/lib/suncord
cp -r dist/* %{buildroot}/usr/lib/suncord/
install -m 755 scripts/suncord.sh %{buildroot}/usr/lib/suncord/suncord.sh

mkdir -p %{buildroot}/usr/share/applications
cat > %{buildroot}/usr/share/applications/suncord.desktop << 'EOF'
[Desktop Entry]
Name=SUNCORD
Comment=Discord client mod with drag-and-drop plugin store
Exec=/usr/lib/suncord/suncord.sh launch
Icon=suncord
Type=Application
Categories=Network;InstantMessaging;
StartupWMClass=discord
EOF

mkdir -p %{buildroot}/usr/bin
ln -sf /usr/lib/suncord/suncord.sh %{buildroot}/usr/bin/suncord

%files
/usr/lib/suncord/
/usr/bin/suncord
/usr/share/applications/suncord.desktop

%changelog
* Sat Aug 30 2026 SUNCORD Team <team@suncord.dev> - 1.0.0-1
- Initial release
