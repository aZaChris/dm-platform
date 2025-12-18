import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { combatService } from '../services/combatService';

const CombatTrackerScreen = ({ route, navigation }) => {
  const { combat } = route.params;
  const [combatData, setCombatData] = useState(combat);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    type: 'character',
    initiative: '',
    hp: '',
    maxHp: '',
    ac: '',
  });
  const [sortBy, setSortBy] = useState('order'); // 'order' | 'initiative'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [showOnlyAlive, setShowOnlyAlive] = useState(false);
  const [highlightLowHp, setHighlightLowHp] = useState(true);

  const loadCombatData = async () => {
    try {
      const result = await combatService.getCombat(combat.id);
      if (result.success) {
        setCombatData(result.data);
        setParticipants(result.data.participants || []);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load combat data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCombatData();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCombatData();
  };

  const handleStartCombat = async () => {
    try {
      const result = await combatService.startCombat(combat.id);
      if (result.success) {
        setCombatData(result.data);
        setParticipants(result.data.participants || []);
        Alert.alert('Success', 'Combat started!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start combat');
    }
  };

  const handleNextTurn = async () => {
    try {
      const result = await combatService.nextTurn(combat.id);
      if (result.success) {
        setCombatData(result.data);
        setParticipants(result.data.participants || []);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to advance turn');
    }
  };

  const handleEndCombat = async () => {
    Alert.alert(
      'End Combat',
      'Are you sure you want to end this combat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await combatService.endCombat(combat.id);
              if (result.success) {
                setCombatData({ ...combatData, isActive: false, currentTurn: 0, round: 1 });
                Alert.alert('Success', 'Combat ended!');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to end combat');
            }
          },
        },
      ]
    );
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.name || !newParticipant.initiative) {
      Alert.alert('Error', 'Please fill in name and initiative');
      return;
    }

    try {
      const participantData = {
        name: newParticipant.name,
        type: newParticipant.type,
        initiative: parseInt(newParticipant.initiative),
        hp: newParticipant.hp ? parseInt(newParticipant.hp) : null,
        maxHp: newParticipant.maxHp ? parseInt(newParticipant.maxHp) : null,
        ac: newParticipant.ac ? parseInt(newParticipant.ac) : null,
      };

      const result = await combatService.addParticipant(combat.id, participantData);
      if (result.success) {
        setShowAddParticipantModal(false);
        setNewParticipant({
          name: '',
          type: 'character',
          initiative: '',
          hp: '',
          maxHp: '',
          ac: '',
        });
        loadCombatData(); // Refresh
        Alert.alert('Success', 'Participant added successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add participant');
    }
  };

  const handleUpdateHP = async (participantId, newHP) => {
    try {
      const result = await combatService.updateParticipant(participantId, { hp: newHP });
      if (result.success) {
        loadCombatData(); // Refresh
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update HP');
    }
  };

  const handleDeltaHP = async (participantId, currentHP, delta) => {
    const next = Math.max(0, (parseInt(currentHP || 0, 10) || 0) + delta);
    await handleUpdateHP(participantId, next);
  };

  const handleRemoveParticipant = async (participantId) => {
    Alert.alert(
      'Remove Participant',
      'Are you sure you want to remove this participant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await combatService.removeParticipant(participantId);
              if (result.success) {
                loadCombatData(); // Refresh
                Alert.alert('Success', 'Participant removed!');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove participant');
            }
          },
        },
      ]
    );
  };

  const handleMoveParticipant = async (participantId, direction) => {
    try {
      const current = participants.find(p => p.id === participantId);
      if (!current) return;
      const byOrder = [...participants].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idx = byOrder.findIndex(p => p.id === participantId);
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= byOrder.length) return;
      const swapWith = byOrder[targetIdx];
      // Swap orders
      await combatService.updateParticipant(current.id, { order: swapWith.order });
      await combatService.updateParticipant(swapWith.id, { order: current.order });
      await loadCombatData();
    } catch (e) {
      Alert.alert('Error', 'Failed to reorder participants');
    }
  };

  const sortedParticipants = useMemo(() => {
    let copy = [...participants];
    if (showOnlyAlive) {
      copy = copy.filter(p => !(p.hp !== null && p.hp <= 0));
    }
    if (sortBy === 'initiative') {
      copy.sort((a, b) => (a.initiative ?? 0) - (b.initiative ?? 0));
    } else {
      copy.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    if (sortDir === 'desc') copy.reverse();
    return copy;
  }, [participants, sortBy, sortDir, showOnlyAlive]);

  const renderParticipant = (participant, index) => {
    const isCurrentTurn = combatData.isActive && combatData.currentTurn === index + 1;
    const isDead = participant.hp !== null && participant.hp <= 0;
    const maxHpSafe = participant.maxHp ? Math.max(1, participant.maxHp) : 1;
    const hpRatio = participant.hp !== null && participant.maxHp ? Math.max(0, Math.min(1, participant.hp / maxHpSafe)) : 0;
    const hpColor = hpRatio <= 0.25 ? '#dc3545' : hpRatio <= 0.5 ? '#fd7e14' : '#28a745';
    
    return (
      <View
        key={participant.id}
        style={[
          styles.participantCard,
          isCurrentTurn && styles.currentTurnCard,
          isDead && styles.deadCard,
          highlightLowHp && hpRatio <= 0.25 && styles.lowHpCard,
        ]}
      >
        <View style={styles.participantHeader}>
          <Text style={styles.participantName}>
            #{participant.order} - {participant.name}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveParticipant(participant.id)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.participantType}>{participant.type}</Text>
        <Text style={styles.participantInitiative}>Initiative: {participant.initiative}</Text>
        
        {participant.hp !== null && (
          <View style={styles.hpSection}>
            <Text style={styles.hpText}>
              HP: {participant.hp}/{participant.maxHp || '?'}
            </Text>
            <View style={styles.hpBar}>
              <View
                style={[
                  styles.hpFill,
                  {
                    width: `${participant.maxHp ? (participant.hp / maxHpSafe) * 100 : 0}%`,
                    backgroundColor: hpColor,
                  },
                ]}
              />
            </View>
            <View style={styles.hpQuickRow}>
              {[-5, -1, +1, +5].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.hpQuickBtn, d < 0 ? styles.hpQuickMinus : styles.hpQuickPlus]}
                  onPress={() => handleDeltaHP(participant.id, participant.hp, d)}
                >
                  <Text style={styles.hpQuickText}>{d > 0 ? `+${d}` : d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.rowBetween}>
              <TextInput
                style={[styles.hpInput, { flex: 1, marginRight: 8 }]}
                value={participant.hp.toString()}
                onChangeText={(text) => {
                  const newHP = parseInt(text) || 0;
                  handleUpdateHP(participant.id, newHP);
                }}
                keyboardType="numeric"
              />
              <View style={styles.reorderRow}>
                <TouchableOpacity style={styles.reorderBtn} onPress={() => handleMoveParticipant(participant.id, 'up')}>
                  <Text style={styles.reorderText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reorderBtn} onPress={() => handleMoveParticipant(participant.id, 'down')}>
                  <Text style={styles.reorderText}>↓</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {participant.ac !== null && (
          <Text style={styles.participantAC}>AC: {participant.ac}</Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading combat...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Combat Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{combatData.name}</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            Status: {combatData.isActive ? '🟢 Active' : '🔴 Inactive'}
          </Text>
          {combatData.isActive && (
            <>
              <Text style={styles.statusText}>
                Turn: {combatData.currentTurn} / Round: {combatData.round}
              </Text>
              <Text style={styles.statusText}>
                Current: {participants[combatData.currentTurn - 1]?.name || 'None'}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Combat Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Combat Controls</Text>
        <View style={styles.controlsRow}>
          {!combatData.isActive ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={handleStartCombat}
            >
              <Text style={styles.controlButtonText}>Start Combat</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.nextButton]}
                onPress={handleNextTurn}
              >
                <Text style={styles.controlButtonText}>Next Turn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.endButton]}
                onPress={handleEndCombat}
              >
                <Text style={styles.controlButtonText}>End Combat</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Participants */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Participants ({sortedParticipants.length})</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={styles.sortChip}
              onPress={() => setSortBy(prev => (prev === 'order' ? 'initiative' : 'order'))}
            >
              <Text style={styles.sortChipText}>{sortBy === 'order' ? 'Order' : 'Initiative'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortChip}
              onPress={() => setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            >
              <Text style={styles.sortChipText}>{sortDir === 'asc' ? 'Asc' : 'Desc'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, showOnlyAlive && styles.sortChipActive]}
              onPress={() => setShowOnlyAlive(v => !v)}
            >
              <Text style={[styles.sortChipText, showOnlyAlive && styles.sortChipTextActive]}>Alive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, highlightLowHp && styles.sortChipActive]}
              onPress={() => setHighlightLowHp(v => !v)}
            >
              <Text style={[styles.sortChipText, highlightLowHp && styles.sortChipTextActive]}>Low HP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddParticipantModal(true)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {participants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No participants yet</Text>
            <Text style={styles.emptySubtext}>
              Add participants to start combat!
            </Text>
          </View>
        ) : (
          <View style={styles.participantsList}>
            {sortedParticipants.map((participant, index) => renderParticipant(participant, index))}
          </View>
        )}
      </View>

      {/* Add Participant Modal */}
      <Modal
        visible={showAddParticipantModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddParticipantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Participant</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={newParticipant.name}
              onChangeText={(text) => setNewParticipant({ ...newParticipant, name: text })}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Initiative"
              value={newParticipant.initiative}
              onChangeText={(text) => setNewParticipant({ ...newParticipant, initiative: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="HP (optional)"
              value={newParticipant.hp}
              onChangeText={(text) => setNewParticipant({ ...newParticipant, hp: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Max HP (optional)"
              value={newParticipant.maxHp}
              onChangeText={(text) => setNewParticipant({ ...newParticipant, maxHp: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="AC (optional)"
              value={newParticipant.ac}
              onChangeText={(text) => setNewParticipant({ ...newParticipant, ac: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddParticipantModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddParticipant}
              >
                <Text style={styles.createButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortChip: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  sortChipActive: {
    backgroundColor: '#3730a3',
    borderColor: '#312e81',
  },
  sortChipText: {
    color: '#3730a3',
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  nextButton: {
    backgroundColor: '#007bff',
  },
  endButton: {
    backgroundColor: '#dc3545',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantsList: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  participantCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentTurnCard: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  deadCard: {
    backgroundColor: '#f8d7da',
    opacity: 0.6,
  },
  lowHpCard: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#fff7ed',
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  participantInitiative: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  participantAC: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  hpSection: {
    marginTop: 10,
  },
  hpText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  hpBar: {
    height: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  hpQuickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hpQuickBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 44,
    alignItems: 'center',
  },
  hpQuickMinus: {
    backgroundColor: '#fff5f5',
    borderColor: '#f5c2c7',
  },
  hpQuickPlus: {
    backgroundColor: '#f0fff4',
    borderColor: '#badbcc',
  },
  hpQuickText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  hpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderBtn: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 6,
  },
  reorderText: {
    fontWeight: '700',
    color: '#374151',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  createButton: {
    backgroundColor: '#007bff',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CombatTrackerScreen;
